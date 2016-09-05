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
  }

  onClick (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    const rect = e.target.getBoundingClientRect()
    windowActions.setContextMenuDetail(Immutable.fromJS({
      left: rect.left,
      top: rect.bottom,
      template: this.props.submenu.map((submenuItem) => {
        if (submenuItem.type === separatorMenuItem.type) {
          return submenuItem
        }
        submenuItem.click = function (e) {
          windowActions.clickMenubarItem(submenuItem.label)
        }
        return submenuItem
      })
    }))
  }

  render () {
    return <span
      className='menubarItem'
      onClick={this.onClick}>
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
  render () {
    return <div className='menubar'>
    {
      this.props.template.map((menubarItem) =>
        <MenubarItem label={menubarItem.get('label')} submenu={menubarItem.get('submenu').toJS()} />)
    }
    </div>
  }
}

module.exports = Menubar
