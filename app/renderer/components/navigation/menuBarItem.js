/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Utils
const {showContextMenu} = require('../../../common/lib/menuUtil')

class MenuBarItem extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
  }

  onClick (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    // If clicking on an already selected item, deselect it
    if (this.props.selected) {
      windowActions.setContextMenuDetail()
      windowActions.setMenuBarSelectedIndex()
      return
    }

    // Otherwise, mark item as selected and show its context menu
    const rect = e.target.getBoundingClientRect()
    windowActions.setMenuBarSelectedIndex(this.props.index)
    windowActions.setContextMenuSelectedIndex()
    showContextMenu(rect, this.props.submenu, this.props.lastFocusedSelector)
  }

  onMouseOver (e) {
    if (typeof this.props.selectedIndex === 'number' && !this.props.selected) {
      this.onClick(e)
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const selectedIndex = currentWindow.getIn(['ui', 'menubar', 'selectedIndex'])
    const template = state.getIn(['menu', 'template', ownProps.index])

    const props = {}
    // used in renderer
    props.index = ownProps.index
    props.selected = ownProps.index === selectedIndex
    props.label = template.get('label')

    // used in other functions
    props.submenu = template.get('submenu') && template.get('submenu').toJS()
    props.lastFocusedSelector = currentWindow.getIn(['ui', 'menubar', 'lastFocusedSelector'])
    props.selectedIndex = selectedIndex

    return props
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

module.exports = ReduxComponent.connect(MenuBarItem)
