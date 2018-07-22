/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const MenuBarItem = require('./menuBarItem')

// Constants
const keyCodes = require('../../../common/constants/keyCodes')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// State
const contextMenuState = require('../../../common/state/contextMenuState.js')

// Utils
const {separatorMenuItem} = require('../../../common/commonMenu')
const {showContextMenu} = require('../../../common/lib/menuUtil')
const {wrappingClamp} = require('../../../common/lib/formatUtil')

/**
 * Menubar that can be optionally be displayed at the top of a window (in favor of the system menu).
 * First intended use is with Windows to enable a slim titlebar.
 * NOTE: the system menu is still created and used in order to keep the accelerators working.
 */
class MenuBar extends React.Component {
  constructor (props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    //add funciton here to run with openSubMenu
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
    if (typeof index !== 'number') {
      index = this.props.selectedIndex
    }

    const selected = document.querySelectorAll('[data-menubar-item][data-index=\'' + index + '\']')
    if (selected.length === 1) {
      return selected.item(0).getBoundingClientRect()
    }

    return null
  }

  onKeyDown (e) {
    //console.log(e.which)
    const selectedIndex = this.props.selectedIndex
    const template = this.props.template
    const contextMenuIndex = this.props.contextMenuSelectedIndex

    if (!template || !template.get(selectedIndex)) {
      return
    }
    if (e.key === 'f' && e.altKey) {
        windowActions.setMenuBarSelectedIndex(0)
        windowActions.setContextMenuSelectedIndex([0])
        showContextMenu(this.getMenubarItemBounds(selectedIndex), template.get(selectedIndex).get('submenu').toJS(), this.props.lastFocusedSelector)
      return
    }
//console.log(e.key)
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

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')

    const props = {}
    // used in renderer
    props.template = state.getIn(['menu', 'template'])

    // used in other functions
    props.selectedIndex = currentWindow.getIn(['ui', 'menubar', 'selectedIndex'])
    props.contextMenuSelectedIndex = contextMenuState.selectedIndex(currentWindow)
    props.contextMenuDetail = currentWindow.has('contextMenuDetail')
    props.lastFocusedSelector = currentWindow.getIn(['ui', 'menubar', 'lastFocusedSelector'])

    return props
  }

  render () {
    return <div className={css(styles.menubar)}>
      {
        this.props.template.map((item, i) => {
          return <MenuBarItem index={i} />
        })
      }
    </div>
  }
}

const styles = StyleSheet.create({
  menubar: {
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    cursor: 'default',
    userSelect: 'none',
    marginTop: '2px',
    height: '19px'
  }
})

module.exports = ReduxComponent.connect(MenuBar)
