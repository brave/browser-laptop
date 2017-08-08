/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../immutableComponent')
const ContextMenuItem = require('./contextMenuItem')

// Utils
const cx = require('../../../../../js/lib/classSet')
const {separatorMenuItem} = require('../../../../common/commonMenu')

/**
 * Represents a single popup menu (not including submenu)
 */
class ContextMenuSingle extends ImmutableComponent {
  render () {
    const styles = {}
    if (this.props.y) {
      styles.marginTop = this.props.y
    }
    const visibleMenuItems = this.props.template ? this.props.template.filter((element) => {
      return element.has('visible')
        ? element.get('visible')
        : true
    }) : new Immutable.List()

    let index = 0
    return <div role='list' className={cx({
      contextMenuSingle: true,
      isSubmenu: this.props.submenuIndex !== 0
    })} style={styles}>
      {
        visibleMenuItems.map((contextMenuItem) => {
          let props = {
            contextMenuItem: contextMenuItem,
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

module.exports = ContextMenuSingle
