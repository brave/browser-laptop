/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const Tab = require('./tab')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const windowStore = require('../stores/windowStore')
const siteTags = require('../constants/siteTags')
const dragTypes = require('../constants/dragTypes')
const siteUtil = require('../state/siteUtil')
const dnd = require('../dnd')
const dndData = require('../dndData')
const {isIntermediateAboutPage} = require('../lib/appUrlUtil')

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
      let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((node) => node && node.props.tab.get('frameKey') !== key), clientX).selectedRef
      if (droppedOnTab) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)
        const droppedOnFrameProps = windowStore.getFrame(droppedOnTab.props.tab.get('frameKey'))
        windowActions.moveTab(sourceDragData, droppedOnFrameProps, isLeftSide)
        if (!sourceDragData.get('pinnedLocation')) {
          appActions.setPinned(sourceDragData.get('tabId'), true)
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
           .map((tab) =>
             <Tab ref={(node) => this.tabRefs.push(node)}
               dragData={this.props.dragData}
               tab={tab}
               key={'tab-' + tab.get('frameKey')}
               paintTabs={this.props.paintTabs}
               previewTabs={this.props.previewTabs}
               isActive={this.props.activeFrameKey === tab.get('frameKey')}
               partOfFullPageSet={this.props.partOfFullPageSet} />)
      }
    </div>
  }
}

module.exports = PinnedTabs
