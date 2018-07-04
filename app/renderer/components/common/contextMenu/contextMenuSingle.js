/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../immutableComponent')
const ContextMenuItem = require('./contextMenuItem')

// Utils
const {separatorMenuItem} = require('../../../../common/commonMenu')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

/**
 * Represents a single popup menu (not including submenu)
 */
class ContextMenuSingle extends ImmutableComponent {
  render () {
    const contextStyles = {}
    if (this.props.y) {
      contextStyles.marginTop = this.props.y
    }
    const visibleMenuItems = this.props.template ? this.props.template.filter((element) => {
      return element.has('visible')
        ? element.get('visible')
        : true
    }) : new Immutable.List()

    let index = 0
    return <div className={css(
      styles.contextMenuSingle,
      (this.props.submenuIndex !== 0) && styles.contextMenuSingle_isSubmenu
    )}
      style={contextStyles}
      role='list'
    >
      {
        visibleMenuItems.map((contextMenuItem) => {
          let props = {
            contextMenuItem: contextMenuItem,
            isTor: this.props.isTor,
            submenuIndex: this.props.submenuIndex,
            lastZoomPercentage: this.props.lastZoomPercentage,
            contextMenuDetail: this.props.contextMenuDetail,
            selected: false
          }
          // don't count separators when finding selectedIndex
          if (contextMenuItem.get('type') !== separatorMenuItem.type) {
            props.dataIndex = index
            props.selected = (index === this.props.selectedIndex)
            index++
          }
          return <ContextMenuItem {...props} />
        })
      }
    </div>
  }
}

const styles = StyleSheet.create({
  contextMenuSingle: {
    backgroundColor: theme.contextMenu.single.backgroundColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.contextMenu.single.borderColor,
    boxShadow: `1px 4px 8px -3px ${theme.contextMenu.single.boxShadowColor}`,
    borderRadius: globalStyles.radius.borderRadius,
    boxSizing: 'border-box',
    display: 'table',
    minWidth: '220px',
    maxWidth: '400px'
  },

  contextMenuSingle_isSubmenu: {
    position: 'relative'
  }
})

module.exports = ContextMenuSingle
