/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const Tab = require('./tab')
const windowActions = require('../actions/windowActions')
const dnd = require('../dnd')

class PinnedTabs extends ImmutableComponent {
  onDrop (e) {
    const key = this.props.sourceDragData.get('key')
    let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter(tab => tab && tab.props.frameProps.get('key') !== key), e.clientX)
    if (droppedOnTab) {
      const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), e.clientX)
      const droppedOnFrameProps = this.props.frames.find(frame => frame.get('key') === droppedOnTab.props.frameProps.get('key'))
      windowActions.moveTab(this.props.sourceDragData, droppedOnFrameProps, isLeftSide)
      if (!this.props.sourceDragData.get('isPinned')) {
        windowActions.setPinned(this.props.sourceDragData, true)
      }
    }
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  render () {
    this.tabRefs = []
    return <div className='pinnedTabs'
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}>
       {
          this.props.frames
            .filter(frameProps => frameProps.get('isPinned'))
            .map(frameProps =>
                <Tab activeDraggedTab={this.props.tabs.get('activeDraggedTab')}
                  ref={node => this.tabRefs.push(node)}
                  sourceDragData={this.props.sourceDragData}
                  draggingOverData={this.props.draggingOverData}
                  frameProps={frameProps}
                  frames={this.props.frames}
                  key={'tab-' + frameProps.get('key')}
                  paintTabs={this.props.paintTabs}
                  previewTabs={this.props.previewTabs}
                  isActive={this.props.activeFrame === frameProps}
                  isPrivate={frameProps.get('isPrivate')}
                  partOfFullPageSet={this.props.partOfFullPageSet}/>)
      }
    </div>
  }
}

module.exports = PinnedTabs
