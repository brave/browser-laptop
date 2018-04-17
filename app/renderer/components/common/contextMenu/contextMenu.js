/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../../reduxComponent')
const ContextMenuSingle = require('./contextMenuSingle')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const keyCodes = require('../../../../common/constants/keyCodes')

// State
const contextMenuState = require('../../../../common/state/contextMenuState')

// Utils
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const {separatorMenuItem} = require('../../../../common/commonMenu')
const {wrappingClamp} = require('../../../../common/lib/formatUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

/**
 * Represents a context menu including all submenus
 */
class ContextMenu extends React.Component {
  constructor (props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onAuxClick = this.onAuxClick.bind(this)
  }

  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)

    if (this.node) {
      this.node.addEventListener('auxclick', this.onAuxClick)
    }
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  onKeyDown (e) {
    let selectedIndex = null
    let currentIndex = null
    let selectedTemplate = null
    let selectedMenuItem = null

    if (this.props.selectedIndex !== null) {
      selectedIndex = this.props.selectedIndex
      currentIndex = selectedIndex[selectedIndex.length - 1]
      selectedTemplate = this.getMenuByIndex(selectedIndex, this.props.contextMenuDetail.get('template'))
      selectedMenuItem = selectedTemplate.get(currentIndex)
    }

    switch (e.keyCode) {
      case keyCodes.ENTER:
      case keyCodes.TAB:
        if (e.keyCode === keyCodes.ENTER) {
          e.preventDefault()
        }

        e.stopPropagation()
        if (currentIndex !== null) {
          const action = selectedTemplate.getIn([currentIndex, 'click'])
          if (action) {
            action(e)
          }
        }
        windowActions.resetMenuState()
        break

      case keyCodes.ESC:
        windowActions.resetMenuState()
        break

      case keyCodes.LEFT:
        // Left arrow inside a sub menu
        // <= go back one level
        if (this.hasSubmenuSelection) {
          const newIndices = selectedIndex.slice()
          newIndices.pop()
          windowActions.setContextMenuSelectedIndex(newIndices)

          let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
            ? this.props.contextMenuDetail.get('openedSubmenuDetails')
            : new Immutable.List()
          openedSubmenuDetails = openedSubmenuDetails.pop()

          windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
        }
        break

      case keyCodes.RIGHT:
        // Right arrow on a menu item which has a sub menu
        // => go up one level (default next menu to item 0)
        const isSubMenu = !!selectedMenuItem.get('submenu')

        if (isSubMenu) {
          e.stopPropagation()
          const newIndices = selectedIndex.slice()
          newIndices.push(0)
          windowActions.setContextMenuSelectedIndex(newIndices)

          let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
            ? this.props.contextMenuDetail.get('openedSubmenuDetails')
            : new Immutable.List()

          const rect = this.getContextMenuItemBounds()
          const itemHeight = (rect.bottom - rect.top)

          openedSubmenuDetails = openedSubmenuDetails.push(Immutable.fromJS({
            y: (rect.top - itemHeight),
            template: selectedMenuItem.get('submenu')
          }))

          windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
        }
        break

      case keyCodes.UP:
      case keyCodes.DOWN:
        if (this.props.contextMenuDetail) {
          let newIndices

          if (selectedIndex === null) {
            newIndices = [0]
          } else {
            const nextIndex = wrappingClamp(
              currentIndex + (e.which === keyCodes.UP ? -1 : 1),
              0,
              this.maxIndex(selectedTemplate))

            newIndices = selectedIndex.slice()
            newIndices[selectedIndex.length - 1] = nextIndex
          }

          windowActions.setContextMenuSelectedIndex(newIndices)
        }
        break
    }
  }

  onKeyUp (e) {
    e.preventDefault()
  }

  onClick () {
    setImmediate(() => windowActions.resetMenuState())
  }

  onAuxClick () {
    setImmediate(() => windowActions.resetMenuState())
  }

  getTemplateItemsOnly (template) {
    return template.filter((element) => {
      if (element.get('type') === separatorMenuItem.type) return false
      if (element.has('visible')) return element.get('visible')
      return true
    })
  }

  getMenuByIndex (selectedIndex, parentItem, currentDepth) {
    parentItem = this.getTemplateItemsOnly(parentItem)
    if (!currentDepth) currentDepth = 0

    const selectedIndices = selectedIndex.slice(1)
    if (selectedIndices.length === 0) return parentItem

    const submenuIndex = selectedIndex[0]
    const childItem = parentItem.get(submenuIndex)

    if (childItem && childItem.get('submenu')) {
      return this.getMenuByIndex(selectedIndices, childItem.get('submenu'), currentDepth + 1)
    }

    return parentItem
  }

  getContextMenuItemBounds () {
    const selected = document.querySelectorAll('[data-context-menu-item-selected-by-keyboard="true"]')
    if (selected.length > 0) {
      return selected.item(selected.length - 1).getBoundingClientRect()
    }
    return null
  }

  /**
   * Upper bound for the active / focused menu.
   */
  maxIndex (template) {
    return template.filter((element) => {
      if (element.get('type') === separatorMenuItem.type) return false
      if (element.has('visible')) return element.get('visible')
      return true
    }).size - 1
  }

  get openedSubmenuDetails () {
    return this.props.contextMenuDetail.get('openedSubmenuDetails') || new Immutable.List()
  }

  get hasSubmenuSelection () {
    return (this.props.selectedIndex === null) ? false : this.props.selectedIndex.length > 1
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const selectedIndex = currentWindow.getIn(['ui', 'contextMenu', 'selectedIndex'], null)
    const contextMenuDetail = contextMenuState.getContextMenu(currentWindow)

    const props = {}
    props.lastZoomPercentage = activeFrame.get('lastZoomPercentage')
    props.contextMenuDetail = contextMenuDetail  // TODO (nejc) only primitives
    props.selectedIndex = typeof selectedIndex === 'object' &&
      Array.isArray(selectedIndex) &&
      selectedIndex.length > 0
        ? selectedIndex
        : null
    props.selectedIndexNorm = selectedIndex === null
      ? [0]
      : props.selectedIndex
    props.selectedIndexChild = props.selectedIndex
      ? props.selectedIndex[0]
      : null
    props.left = contextMenuDetail.get('left')
    props.right = contextMenuDetail.get('right')
    props.top = contextMenuDetail.get('top')
    props.bottom = contextMenuDetail.get('bottom')
    props.width = contextMenuDetail.get('width')
    props.maxHeight = contextMenuDetail.get('maxHeight')
    props.template = contextMenuDetail.get('template')

    return props
  }

  render () {
    const contextStyles = {}
    if (this.props.left !== undefined) {
      contextStyles.left = this.props.left
    }
    if (this.props.right !== undefined) {
      contextStyles.right = this.props.right
    }
    if (this.props.top !== undefined) {
      contextStyles.marginTop = this.props.top
    }
    if (this.props.bottom !== undefined) {
      contextStyles.bottom = this.props.bottom
    }
    if (this.props.width !== undefined) {
      contextStyles.width = this.props.width
    }
    if (this.props.maxHeight) {
      contextStyles.maxHeight = this.props.maxHeight
    }

    return <div className={css(
      styles.contextMenu,
      (this.props.right !== undefined) && styles.contextMenu_reverseExpand,
      (this.props.maxHeight !== undefined) && styles.contextMenu_scrollable
    )}
      data-context-menu
      data-test-id='contextMenu'
      ref={(node) => { this.node = node }}
      onClick={this.onClick}
      style={contextStyles}
    >
      <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
        submenuIndex={0}
        lastZoomPercentage={this.props.lastZoomPercentage}
        template={this.props.template}
        selectedIndex={this.props.selectedIndexChild} />
      {
        this.openedSubmenuDetails.map((openedSubmenuDetail, i) =>
          <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
            submenuIndex={i + 1}
            lastZoomPercentage={this.props.lastZoomPercentage}
            template={openedSubmenuDetail.get('template')}
            y={openedSubmenuDetail.get('y')}
            selectedIndex={
              this.props.selectedIndexNorm && (i + 1) < this.props.selectedIndexNorm.length
                ? this.props.selectedIndexNorm[i + 1]
                : null} />)
      }
    </div>
  }
}

const styles = StyleSheet.create({
  contextMenu: {
    borderRadius: globalStyles.radius.borderRadius,
    boxSizing: 'border-box',
    color: theme.contextMenu.color,
    cursor: 'default',
    display: 'flex',
    fontSize: globalStyles.spacing.contextMenuFontSize,
    overflow: 'auto',
    position: 'absolute',
    zIndex: globalStyles.zindex.zindexContextMenu,
    paddingRight: '10px',
    paddingBottom: '10px',
    userSelect: 'none',
    minWidth: '225px',

    // This is a reasonable max height and also solves problems for bookmarks menu
    // and bookmarks overflow menu reaching down too low.
    maxHeight: `calc(100% - ${globalStyles.spacing.navbarHeight} + ${globalStyles.spacing.bookmarksToolbarWithFaviconsHeight})`,

    '::-webkit-scrollbar': {
      backgroundColor: theme.contextMenu.scrollBar.backgroundColor
    }
  },

  contextMenu_reverseExpand: {
    flexDirection: 'row-reverse',
    paddingRight: 0,
    paddingLeft: '10px'
  },

  contextMenu_scrollable: {
    overflowY: 'scroll'
  }
})

module.exports = ReduxComponent.connect(ContextMenu)
