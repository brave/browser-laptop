/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

const ImmutableComponent = require('./immutableComponent')

const WindowActions = require('../actions/windowActions')

const FrameStateUtil = require('../state/frameStateUtil')

const Button = require('./button')
const Tab = require('./tab')

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

  render () {
    return <div className='tabs'>
        {(() => {
          if (this.props.tabPageIndex > 0) {
            return <span
                className='prevTab fa fa-angle-double-left'
                onClick={this.onPrevPage.bind(this)} />
          }
        })()}
        <span className='tabContainer'>
        {
          this.props.currentFrames
            .filter(frameProps => !frameProps.get('isPinned'))
            .map(frameProps =>
                <Tab activeDraggedTab={this.props.tabs.get('activeDraggedTab')}
                  frameProps={frameProps}
                  frames={this.props.frames}
                  key={'tab-' + frameProps.get('key')}
                  paintTabs={this.props.paintTabs}
                  previewTabs={this.props.previewTabs}
                  isActive={this.props.activeFrame === frameProps}
                  isPrivate={frameProps.get('isPrivate')}
                  partOfFullPageSet={this.props.partOfFullPageSet}/>)
        }
        { !this.props.partOfFullPageSet && this.props.currentFrames.size !== 0
        ? <Button label='+'
          className='navbutton newFrameButton'
          onClick={WindowActions.newFrame} /> : null }
        </span>
        {(() => {
          if (this.props.currentFrames.size >= this.props.tabsPerTabPage && this.totalPages > this.props.tabPageIndex + 1) {
            return <span
              className='nextTab fa fa-angle-double-right'
              onClick={this.onNextPage.bind(this)} />
          }
        })()}
    </div>
  }
}

module.exports = Tabs
