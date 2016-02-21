/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const WindowActions = require('../actions/windowActions')
const {onTabPageContextMenu} = require('../contextMenus')

class TabPage extends ImmutableComponent {
  onDrop (e) {
    if (this.props.frames.size === 0) {
      return
    }
    const moveToFrame = this.props.frames.get(0)
    // If we're moving to a right page, then we're already shifting everything to the left by one, so we want
    // to drop it on the right.
    WindowActions.moveTab(this.props.sourceDragData, moveToFrame,
      // Has -1 value for pinned tabs
      this.props.sourceDragFromPageIndex === -1 ||
      this.props.sourceDragFromPageIndex >= this.props.index)
    if (this.props.sourceDragData.get('isPinned')) {
      WindowActions.setPinned(this.props.sourceDragData, false)
    }
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  render () {
    const audioPlaybackActive = this.props.frames.find(frame =>
      frame.get('audioPlaybackActive') && !frame.get('audioMuted'))
    return <span data-tab-page={this.props.index}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      className={cx({
        tabPage: true,
        audioPlaybackActive,
        active: this.props.active})}
        onContextMenu={onTabPageContextMenu.bind(this, this.props.frames)}
        onClick={WindowActions.setTabPageIndex.bind(this, this.props.index)
      }>
    </span>
  }
}

class TabPages extends ImmutableComponent {
  render () {
    const tabPageCount = Math.ceil(this.props.frames.size / this.props.tabsPerTabPage)
    let sourceDragFromPageIndex
    if (this.props.sourceDragData) {
      sourceDragFromPageIndex = this.props.frames.findIndex(frame => frame.get('key') === this.props.sourceDragData.get('key'))
      if (sourceDragFromPageIndex !== -1) {
        sourceDragFromPageIndex /= this.props.tabsPerTabPage
      }
    }
    console.log(this.props.sourceDragData)
    return <div>
    {
      tabPageCount > 1 &&
      Array.from(new Array(tabPageCount)).map((x, i) =>
        <TabPage
          key={`tabPage-${i}`}
          frames={this.props.frames.slice(i * this.props.tabsPerTabPage, i * this.props.tabsPerTabPage + this.props.tabsPerTabPage)}
          index={i}
          sourceDragData={this.props.sourceDragData}
          sourceDragFromPageIndex={sourceDragFromPageIndex}
          active={this.props.tabPageIndex === i}/>)
    }
    </div>
  }
}

module.exports = TabPages
