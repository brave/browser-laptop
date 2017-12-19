/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Utils
const {showContextMenu} = require('../../../common/lib/menuUtil')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

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
    const template = state.getIn(['menu', 'template', ownProps.index], Immutable.Map())

    const props = {}
    // used in renderer
    props.index = ownProps.index
    props.selected = ownProps.index === selectedIndex
    props.label = template.get('label')

    // used in other functions
    props.submenu = template.get('submenu') && template.get('submenu').toJS() // TODO (nejc) only primitives
    props.lastFocusedSelector = currentWindow.getIn(['ui', 'menubar', 'lastFocusedSelector'])
    props.selectedIndex = selectedIndex

    return props
  }

  render () {
    return <span className={css(
      styles.menubarItem,
      this.props.selected && styles.menubarItem_selected
    )}
      data-menubar-item
      onClick={this.onClick}
      onMouseOver={this.onMouseOver}
      data-index={this.props.index}
    >
      { this.props.label }
    </span>
  }
}

const breakpointSmallWin32 = `@media screen and (max-width: ${globalStyles.breakpoint.breakpointSmallWin32})`
const breakpointTinyWin32 = `@media screen and (max-width: ${globalStyles.breakpoint.breakpointTinyWin32})`

const styles = StyleSheet.create({
  menubarItem: {
    boxSizing: 'border-box',
    color: theme.navigator.menuBar.item.color,
    font: 'menu',
    fontSize: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.navigator.menuBar.item.borderColor,
    WebkitAppRegion: 'no-drag',

    padding: '0 10px 1px',
    [breakpointSmallWin32]: { padding: '0 5px 1px' },
    [breakpointTinyWin32]: { padding: '0 3px 1px' },

    ':hover': {
      backgroundColor: theme.navigator.menuBar.item.onHover.backgroundColor,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: theme.navigator.menuBar.item.onHover.borderColor
    }
  },

  menubarItem_selected: {
    backgroundColor: theme.navigator.menuBar.item.selected.backgroundColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.navigator.menuBar.item.selected.borderColor,

    ':hover': {
      backgroundColor: theme.navigator.menuBar.item.selected.backgroundColor,
      borderColor: theme.navigator.menuBar.item.selected.borderColor
    }
  }
})

module.exports = ReduxComponent.connect(MenuBarItem)
