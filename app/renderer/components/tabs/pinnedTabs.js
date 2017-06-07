/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

// Components
const ReduxComponent = require('../reduxComponent')
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
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')

class PinnedTabs extends React.Component {
  constructor (props) {
    super(props)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
  }

  dropFrame (frameKey) {
    return windowStore.getFrame(frameKey)
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
      let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((node) => node && node.props.frameKey !== key), clientX).selectedRef
      if (droppedOnTab) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)
        windowActions.moveTab(key, droppedOnTab.props.frameKey, isLeftSide)
        if (!sourceDragData.get('pinnedLocation')) {
          appActions.tabPinned(sourceDragData.get('tabId'), true)
        } else {
          const sourceDetails = siteUtil.getDetailFromFrame(sourceDragData, siteTags.PINNED)
          const droppedOnFrame = this.dropFrame(droppedOnTab.props.frameKey)
          const destinationDetails = siteUtil.getDetailFromFrame(droppedOnFrame, siteTags.PINNED)
          appActions.moveSite(siteUtil.getSiteKey(sourceDetails),
            siteUtil.getSiteKey(destinationDetails),
            isLeftSide)
        }
      }
    }, 0)
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const pinnedFrames = frameStateUtil.getPinnedFrames(currentWindow)

    const props = {}
    // used in renderer
    props.pinnedTabs = pinnedFrames.map((frame) => frame.get('key'))

    return props
  }

  render () {
    this.tabRefs = []
    return <div
      className='pinnedTabs'
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}>
      {
         this.props.pinnedTabs
           .map((frameKey) =>
             <Tab
               key={'tab-' + frameKey}
               ref={(node) => this.tabRefs.push(node)}
               frameKey={frameKey}
             />
           )
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(PinnedTabs)
