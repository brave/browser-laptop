/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const windowActions = require('../../../js/actions/windowActions')
const separatorMenuItem = require('../../common/commonMenu').separatorMenuItem
const keyCodes = require('../../../js/constants/keyCodes')

const showContextMenu = (rect, submenu) => {
  windowActions.setContextMenuDetail(Immutable.fromJS({
    left: rect.left,
    top: rect.bottom,
    template: submenu.map((submenuItem) => {
      if (submenuItem.type === separatorMenuItem.type) {
        return submenuItem
      }
      submenuItem.click = function (e) {
        windowActions.clickMenubarSubmenu(submenuItem.label)
      }
      return submenuItem
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
    const selected = this.props.menubar.props.selectedLabel
    if (selected && selected === this.props.label) {
      windowActions.setContextMenuDetail()
      windowActions.setMenubarItemSelected()
      return
    }
    // Otherwise, mark item as selected and show its context menu
    windowActions.setMenubarItemSelected(this.props.label)
    const rect = e.target.getBoundingClientRect()
    showContextMenu(rect, this.props.submenu)
  }

  onMouseOver (e) {
    const selected = this.props.menubar.props.selectedLabel
    if (selected && selected !== this.props.label) {
      this.onClick(e)
    }
  }

  render () {
    return <span
      className={'menubarItem' + (this.props.selected ? ' selected' : '')}
      onClick={this.onClick}
      onMouseOver={this.onMouseOver}>
      { this.props.label }
    </span>
  }
}

// BSCTODO: where to put this?
const wrappingClamp = (value, min, max) => {
  var range = (max - min) + 1
  return value - Math.floor((value - min) / range) * range
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
    document.addEventListener('keydown', this.onKeyDown)
  }

  get selectedTemplate () {
    const element = this.props.template.find((element) => {
      return element.get('label') === this.props.selectedLabel
    })
    return element ? element.get('submenu') : null
  }

  get selectedRect () {
    const selected = document.querySelectorAll('.menubar .selected')
    if (selected.length === 1) {
      return selected.item(0).getBoundingClientRect()
    }
    return null
  }

  onKeyDown (e) {
    // BSCTODO: how to handle if menu is ALWAYS showing?
    //          we can't just eat (preventDefault) the arrow keys :(
    switch (e.which) {
      case keyCodes.LEFT:
      case keyCodes.RIGHT:
        e.preventDefault()

        if (this.props.template.size > 0) {
          const selectedIndex = this.props.template.findIndex((element) => {
            return element.get('label') === this.props.selectedLabel
          })
          const nextIndex = selectedIndex === -1
            ? 0
            : wrappingClamp(
              selectedIndex + (e.which === keyCodes.LEFT ? -1 : 1),
              0,
              this.props.template.size - 1)

          // BSCTODO: consider submenus
          windowActions.setMenubarItemSelected(this.props.template.getIn([nextIndex, 'label']))

          // Context menu already being displayed; auto-open the next one
          if (this.props.contextMenuDetail && this.selectedTemplate && this.selectedRect) {
            // BSCTODO: if already selected and in a menu, set the Y index to 0
            // BSCTODO: this logic should happen *after* render
            showContextMenu(this.selectedRect, this.selectedTemplate)
          }
        }
        break
      case keyCodes.UP:
      case keyCodes.DOWN:
        if (this.props.selectedLabel) {
          if (!this.selectedTemplate) break

          if (!this.props.contextMenuDetail && this.selectedRect) {
            // First time hitting up/down; popup the context menu
            showContextMenu(this.selectedRect, this.selectedTemplate)
          } else {
            // Context menu already visible; move selection up or down
            // BSCTODO: need a new windowState to track active context menu selected index
          }
        }
        break
    }
  }

  // BSCTODO: keyup handler needed:
  // - for ESC, to set selection to null (context menu already handles ESC properly)
  // - for ALT, unset selection and hide menu

  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  shouldComponentUpdate (nextProps, nextState) {
    return this.props.selectedLabel !== nextProps.selectedLabel
  }

  render () {
    return <div className='menubar'>
    {
      this.props.template.map((menubarItem) => {
        let props = {
          label: menubarItem.get('label'),
          submenu: menubarItem.get('submenu').toJS(),
          menubar: this
        }
        if (props.label === this.props.selectedLabel) {
          props.selected = true
        }
        return <MenubarItem {...props} />
      })
    }
    </div>
  }
}

module.exports = Menubar
