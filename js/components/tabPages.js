/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet')
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const dragTypes = require('../constants/dragTypes')
const {onTabPageContextMenu} = require('../contextMenus')
const dnd = require('../dnd')
const dndData = require('../dndData')

class TabPage extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }
  onMouseLeave () {
    window.clearTimeout(this.hoverTimeout)
    windowActions.setPreviewTabPageIndex()
  }

  onMouseEnter (e) {
    // relatedTarget inside mouseenter checks which element before this event was the pointer on
    // if this element has a tab-like class, then it's likely that the user was previewing
    // a sequency of tabs. Called here as previewMode.
    const previewMode = /tab(?!pages)/i.test(e.relatedTarget.classList)

    // If user isn't in previewMode, we add a bit of delay to avoid tab from flashing out
    // as reported here: https://github.com/brave/browser-laptop/issues/1434
    this.hoverTimeout =
      window.setTimeout(windowActions.setPreviewTabPageIndex.bind(null, this.props.index), previewMode ? 0 : 200)
  }

  onDrop (e) {
    if (this.props.frames.size === 0) {
      return
    }
    const moveToFrame = this.props.frames.get(0)
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    const sourceDragFromPageIndex = this.props.sourceDragFromPageIndex
    // This must be executed async because the state change that this causes
    // will cause the onDragEnd to never run
    setTimeout(() => {
      // If we're moving to a right page, then we're already shifting everything to the left by one, so we want
      // to drop it on the right.
      windowActions.moveTab(sourceDragData, moveToFrame,
        // Has -1 value for pinned tabs
        sourceDragFromPageIndex === -1 ||
        sourceDragFromPageIndex >= this.props.index)
      if (sourceDragData.get('pinnedLocation')) {
        appActions.tabPinned(sourceDragData.get('tabId'), false)
      }
    }, 0)
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  render () {
    const audioPlaybackActive = this.props.frames.find((frame) =>
      frame.get('audioPlaybackActive') && !frame.get('audioMuted'))
    return <span data-tab-page={this.props.index}
      onDragOver={this.onDragOver.bind(this)}
      onMouseEnter={this.props.previewTabPage ? this.onMouseEnter : null}
      onMouseLeave={this.props.previewTabPage ? this.onMouseLeave : null}
      onDrop={this.onDrop.bind(this)}
      className={cx({
        tabPage: true,
        audioPlaybackActive,
        active: this.props.active})}
      onContextMenu={onTabPageContextMenu.bind(this, this.props.frames)}
      onClick={windowActions.setTabPageIndex.bind(this, this.props.index)
      } />
  }
}

class TabPages extends ImmutableComponent {
  render () {
    const tabPageCount = Math.ceil(this.props.frames.size / this.props.tabsPerTabPage)
    let sourceDragFromPageIndex
    const sourceDragData = dnd.getInterBraveDragData()
    if (sourceDragData) {
      sourceDragFromPageIndex = this.props.frames.findIndex((frame) => frame.get('key') === sourceDragData.get('key'))
      if (sourceDragFromPageIndex !== -1) {
        sourceDragFromPageIndex /= this.props.tabsPerTabPage
      }
    }
    return <div className='tabPageWrap'>
      {
        tabPageCount > 1 &&
        Array.from(new Array(tabPageCount)).map((x, i) =>
          <TabPage
            key={`tabPage-${i}`}
            frames={this.props.frames.slice(i * this.props.tabsPerTabPage, (i * this.props.tabsPerTabPage) + this.props.tabsPerTabPage)}
            previewTabPage={this.props.previewTabPage}
            index={i}
            sourceDragFromPageIndex={sourceDragFromPageIndex}
            active={this.props.tabPageIndex === i} />)
      }
    </div>
  }
}

module.exports = TabPages
