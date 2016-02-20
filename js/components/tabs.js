/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')

const WindowActions = require('../actions/windowActions')

const FrameStateUtil = require('../state/frameStateUtil')

const Button = require('./button')
const Tab = require('./tab')
const dnd = require('../dnd')

class Tabs extends ImmutableComponent {
  get activeFrameIndex () {
    return FrameStateUtil.getFramePropsIndex(this.props.frames, this.props.activeFrame)
  }

  onPrevPage () {
    if (this.props.tabs.get('tabPageIndex') === 0) {
      return
    }
    WindowActions.setTabPageIndex(this.props.tabs.get('tabPageIndex') - 1)
  }

  onNextPage () {
    if (this.props.tabs.get('tabPageIndex') + 1 === this.totalPages) {
      return
    }
    WindowActions.setTabPageIndex(this.props.tabs.get('tabPageIndex') + 1)
  }

  get totalPages () {
    return Math.ceil(this.props.frames
        .filter(frame => !frame.get('isPinned'))
        .size / this.props.tabsPerTabPage)
  }

  onDrop (e) {
    const key = this.props.sourceDragData.get('key')
    let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter(tab => tab && tab.props.frameProps.get('key') !== key), e.clientX)
    if (droppedOnTab) {
      const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), e.clientX)
      const droppedOnFrameProps = this.props.frames.find(frame => frame.get('key') === droppedOnTab.props.frameProps.get('key'))
      WindowActions.moveTab(this.props.sourceDragData, droppedOnFrameProps, isLeftSide)
      if (this.props.sourceDragData.get('isPinned')) {
        WindowActions.setPinned(this.props.sourceDragData, false)
      }
    }
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  render () {
    this.tabRefs = []
    return <div className='tabs'>
        <span className='tabContainer'
          onDragOver={this.onDragOver.bind(this)}
          onDrop={this.onDrop.bind(this)}>
        {(() => {
          if (this.props.tabPageIndex > 0) {
            return <span
                className='prevTab fa fa-angle-double-left'
                onClick={this.onPrevPage.bind(this)} />
          }
        })()}
        {
          this.props.currentFrames
            .filter(frameProps => !frameProps.get('isPinned'))
            .map(frameProps =>
                <Tab ref={node => this.tabRefs.push(node)}
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
        {(() => {
          if (this.props.currentFrames.size >= this.props.tabsPerTabPage && this.totalPages > this.props.tabPageIndex + 1) {
            return <span
              className='nextTab fa fa-angle-double-right'
              onClick={this.onNextPage.bind(this)} />
          }
        })()}
        <Button label='+'
          l10nId='newTabButton'
          className='navbutton newFrameButton'
          onClick={WindowActions.newFrame} />
        </span>
    </div>
  }
}

module.exports = Tabs
