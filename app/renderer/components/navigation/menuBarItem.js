/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Utils
const {showContextMenu} = require('../../../common/lib/menuUtil')

class MenuBarItem extends ImmutableComponent {
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
    windowActions.setContextMenuSelectedIndex()
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

module.exports = MenuBarItem
