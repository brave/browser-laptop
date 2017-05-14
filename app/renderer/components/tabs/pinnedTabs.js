/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

// Components
const ImmutableComponent = require('../immutableComponent')
const Tab = require('./tab')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Constants
const siteTags = require('../../../../js/constants/siteTags')
const dragTypes = require('../../../../js/constants/dragTypes')

// Utils
const siteUtil = require('../../../../js/state/siteUtil')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')

class PinnedTabs extends ImmutableComponent {
  constructor () {
    super()
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
  }

  onDrop (e) {
    const clientX = e.clientX
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    const location = sourceDragData.get('location')
    if (location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) {
      return
    }

    // This must be executed async because the state change that this causes
    // will cause the onDragEnd to never run
    setTimeout(() => {
      const key = sourceDragData.get('key')
      let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((node) => node && node.props.frame.get('key') !== key), clientX).selectedRef
      if (droppedOnTab) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)
        const droppedOnFrameProps = windowStore.getFrame(droppedOnTab.props.frame.get('key'))
        windowActions.moveTab(sourceDragData, droppedOnFrameProps, isLeftSide)
        if (!sourceDragData.get('pinnedLocation')) {
          appActions.tabPinned(sourceDragData.get('tabId'), true)
        } else {
          appActions.moveSite(siteUtil.getDetailFromFrame(sourceDragData, siteTags.PINNED),
            siteUtil.getDetailFromFrame(droppedOnFrameProps, siteTags.PINNED),
            isLeftSide)
        }
      }
    }, 0)
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  render () {
    this.tabRefs = []
    return <div className='pinnedTabs'
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}>
      {
         this.props.pinnedTabs
           .map((frame) =>
             <Tab ref={(node) => this.tabRefs.push(node)}
               dragData={this.props.dragData}
               frame={frame}
               key={'tab-' + frame.get('key')}
               paintTabs={this.props.paintTabs}
               previewTabs={this.props.previewTabs}
               isActive={this.props.activeFrameKey === frame.get('key')}
               notificationBarActive={this.props.notificationBarActive}
               partOfFullPageSet={this.props.partOfFullPageSet} />)
      }
    </div>
  }
}

module.exports = PinnedTabs
