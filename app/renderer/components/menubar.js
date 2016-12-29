/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const windowActions = require('../../../js/actions/windowActions')
const separatorMenuItem = require('../../common/commonMenu').separatorMenuItem
const keyCodes = require('../../common/constants/keyCodes')
const {wrappingClamp} = require('../../common/lib/formatUtil')

const bindClickHandler = (contextMenu, lastFocusedSelector) => {
  if (contextMenu.type === separatorMenuItem.type) {
    return contextMenu
  }
  contextMenu.click = function (e) {
    e.preventDefault()
    if (lastFocusedSelector) {
      // Send focus back to the active web frame
      const results = document.querySelectorAll(lastFocusedSelector)
      if (results.length === 1) results[0].focus()
    }
    windowActions.clickMenubarSubmenu(contextMenu.label)
  }
  if (contextMenu.submenu) {
    contextMenu.submenu = contextMenu.submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }
  return contextMenu
}

const showContextMenu = (rect, submenu, lastFocusedSelector) => {
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: rect.left,
    top: rect.bottom,
    template: submenu.map((submenuItem) => {
      return bindClickHandler(submenuItem, lastFocusedSelector)
    })
  }))
}

class MenubarItem extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
  }
  onClick (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    // If clicking on an already selected item, deselect it
    const selected = this.props.menubar.props.selectedIndex
    if (selected && selected === this.props.index) {
      windowActions.setContextMenuDetail()
      windowActions.setMenuBarSelectedIndex()
      return
    }
    // Otherwise, mark item as selected and show its context menu
    windowActions.setMenuBarSelectedIndex(this.props.index)
    windowActions.setContextMenuSelectedIndex([0])
    const rect = e.target.getBoundingClientRect()
    showContextMenu(rect, this.props.submenu, this.props.lastFocusedSelector)
  }
  onMouseOver (e) {
    const selected = this.props.menubar.props.selectedIndex
    if (typeof selected === 'number' && selected !== this.props.index) {
      this.onClick(e)
    }
  }
  render () {
    return <span
      className={'menubarItem' + (this.props.selected ? ' selected' : '')}
      onClick={this.onClick}
      onMouseOver={this.onMouseOver}
      data-index={this.props.index}>
      { this.props.label }
    </span>
  }
}

/**
 * Menubar that can be optionally be displayed at the top of a window (in favor of the system menu).
 * First intended use is with Windows to enable a slim titlebar.
 * NOTE: the system menu is still created and used in order to keep the accelerators working.
 */
class Menubar extends ImmutableComponent {
  constructor () {
    super()
    this.onKeyDown = this.onKeyDown.bind(this)
  }
  componentWillMount () {
    document.addEventListener('keydown', this.onKeyDown)
  }
  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  /**
   * Get client rect for the MenubarItem controls.
   * Used to position the context menu object.
   */
  getMenubarItemBounds (index) {
    if (typeof index !== 'number') index = this.props.selectedIndex
    const selected = document.querySelectorAll('.menubar .menubarItem[data-index=\'' + index + '\']')
    if (selected.length === 1) {
      return selected.item(0).getBoundingClientRect()
    }
    return null
  }

  onKeyDown (e) {
    const selectedIndex = this.props.selectedIndex
    const template = this.props.template
    const contextMenuIndex = this.props.contextMenuSelectedIndex

    if (!template) return

    switch (e.which) {
      case keyCodes.LEFT:
      case keyCodes.RIGHT:
        if (contextMenuIndex !== null) {
          const currentTemplate = template.get(selectedIndex).get('submenu').filter((element) => {
            if (element.get('type') === separatorMenuItem.type) return false
            if (element.has('visible')) return element.get('visible')
            return true
          }).get(contextMenuIndex[0])

          if (currentTemplate && currentTemplate.has('submenu')) {
            break
          }
        }

        e.preventDefault()
        e.stopPropagation()

        // Regular old menu item
        const nextIndex = selectedIndex === null
          ? 0
          : wrappingClamp(
              selectedIndex + (e.which === keyCodes.LEFT ? -1 : 1),
              0,
              this.props.template.size - 1)

        windowActions.setMenuBarSelectedIndex(nextIndex)

        if (this.props.contextMenuDetail) {
          windowActions.setContextMenuSelectedIndex([0])
          showContextMenu(this.getMenubarItemBounds(nextIndex), template.get(nextIndex).get('submenu').toJS(), this.props.lastFocusedSelector)
        } else {
          windowActions.setContextMenuSelectedIndex()
        }
        break

      case keyCodes.DOWN:
      case keyCodes.ENTER:
        e.preventDefault()
        if (contextMenuIndex === null && template.get(selectedIndex).has('submenu')) {
          e.stopPropagation()
          windowActions.setContextMenuSelectedIndex([0])
          showContextMenu(this.getMenubarItemBounds(selectedIndex), template.get(selectedIndex).get('submenu').toJS(), this.props.lastFocusedSelector)
        }
        break

      case keyCodes.UP:
        e.preventDefault()

    }
  }
  shouldComponentUpdate (nextProps, nextState) {
    return this.props.selectedIndex !== nextProps.selectedIndex ||
      this.props.template !== nextProps.template
  }
  render () {
    let i = 0
    return <div className='menubar'>
      {
        this.props.template.map((menubarItem) => {
          let props = {
            label: menubarItem.get('label'),
            index: i++,
            submenu: menubarItem.get('submenu').toJS(),
            lastFocusedSelector: this.props.lastFocusedSelector,
            menubar: this
          }
          if (props.index === this.props.selectedIndex) {
            props.selected = true
          }
          return <MenubarItem {...props} />
        })
      }
    </div>
  }
}

module.exports = Menubar
