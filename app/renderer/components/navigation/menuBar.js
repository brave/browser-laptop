/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')
const MenuBarItem = require('./menuBarItem')

// Constants
const keyCodes = require('../../../common/constants/keyCodes')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Utils
const {separatorMenuItem} = require('../../../common/commonMenu')
const {showContextMenu} = require('../../../common/lib/menuUtil')
const {wrappingClamp} = require('../../../common/lib/formatUtil')

/**
 * Menubar that can be optionally be displayed at the top of a window (in favor of the system menu).
 * First intended use is with Windows to enable a slim titlebar.
 * NOTE: the system menu is still created and used in order to keep the accelerators working.
 */
class MenuBar extends ImmutableComponent {
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

    if (!template || !template.get(selectedIndex)) {
      return
    }

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
        if (contextMenuIndex === null &&
            template.get(selectedIndex).has('submenu')) {
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
          return <MenuBarItem {...props} />
        })
      }
    </div>
  }
}

module.exports = MenuBar
