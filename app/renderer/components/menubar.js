/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const windowActions = require('../../../js/actions/windowActions')
const separatorMenuItem = require('../../common/commonMenu').separatorMenuItem

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
    windowActions.setContextMenuDetail(Immutable.fromJS({
      left: rect.left,
      top: rect.bottom,
      template: this.props.submenu.map((submenuItem) => {
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

/**
 * Menubar that can be optionally be displayed at the top of a window (in favor of the system menu).
 * First intended use is with Windows to enable a slim titlebar.
 * NOTE: the system menu is still created and used in order to keep the accelerators working.
 */
class Menubar extends ImmutableComponent {
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
