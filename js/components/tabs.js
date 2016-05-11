/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')

const windowActions = require('../actions/windowActions')
const dragTypes = require('../constants/dragTypes')
const cx = require('../lib/classSet')

const FrameStateUtil = require('../state/frameStateUtil')

const Button = require('./button')
const Tab = require('./tab')
const dnd = require('../dnd')
const dndData = require('../dndData')

class Tabs extends ImmutableComponent {
  constructor () {
    super()
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onPrevPage = this.onPrevPage.bind(this)
    this.onNextPage = this.onNextPage.bind(this)
  }

  get activeFrameIndex () {
    return FrameStateUtil.getFramePropsIndex(this.props.frames, this.props.activeFrame)
  }

  onPrevPage () {
    if (this.props.tabs.get('tabPageIndex') === 0) {
      return
    }
    windowActions.setTabPageIndex(this.props.tabs.get('tabPageIndex') - 1)
  }

  onNextPage () {
    if (this.props.tabs.get('tabPageIndex') + 1 === this.totalPages) {
      return
    }
    windowActions.setTabPageIndex(this.props.tabs.get('tabPageIndex') + 1)
  }

  get totalPages () {
    return Math.ceil(this.props.frames
        .filter((frame) => !frame.get('pinnedLocation'))
        .size / this.props.tabsPerTabPage)
  }

  onDrop (e) {
    const clientX = e.clientX
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    if (sourceDragData) {
      // This must be executed async because the state change that this causes
      // will cause the onDragEnd to never run
      setTimeout(() => {
        const key = sourceDragData.get('key')
        let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((tab) => tab && tab.props.frameProps.get('key') !== key), clientX).selectedRef
        if (droppedOnTab) {
          const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)
          const droppedOnFrameProps = this.props.frames.find((frame) => frame.get('key') === droppedOnTab.props.frameProps.get('key'))
          windowActions.moveTab(sourceDragData, droppedOnFrameProps, isLeftSide)
          if (sourceDragData.get('pinnedLocation')) {
            windowActions.setPinned(sourceDragData, false)
          }
        }
      }, 0)
      return
    }
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach((file) =>
        windowActions.newFrame({location: file.path, title: file.name}))
    }
  }

  onDragOver (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.TAB)) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }
    let intersection = e.dataTransfer.types.filter((x) => ['Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  render () {
    this.tabRefs = []
    return <div className='tabs'>
      <span className={cx({
        tabStripContainer: true,
        allowDragging: this.props.shouldAllowWindowDrag
      })}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}>
        {(() => {
          if (this.props.tabPageIndex > 0) {
            return <span
              className='prevTab fa fa-caret-left'
              onClick={this.onPrevPage} />
          }
        })()}
        {
          this.props.currentFrames
            .filter((frameProps) => !frameProps.get('pinnedLocation'))
            .map((frameProps) =>
              <Tab ref={(node) => this.tabRefs.push(node)}
                draggingOverData={this.props.draggingOverData}
                frameProps={frameProps}
                frames={this.props.frames}
                key={'tab-' + frameProps.get('key')}
                paintTabs={this.props.paintTabs}
                previewTabs={this.props.previewTabs}
                isActive={this.props.activeFrame === frameProps}
                isPrivate={frameProps.get('isPrivate')}
                partOfFullPageSet={this.props.partOfFullPageSet} />)
        }
        {(() => {
          if (this.props.currentFrames.size >= this.props.tabsPerTabPage && this.totalPages > this.props.tabPageIndex + 1) {
            return <span
              className='nextTab fa fa-caret-right'
              onClick={this.onNextPage} />
          }
        })()}
        <Button label='+'
          l10nId='newTabButton'
          className='navbutton newFrameButton'
          onClick={windowActions.newFrame} />
      </span>
    </div>
  }
}

module.exports = Tabs
