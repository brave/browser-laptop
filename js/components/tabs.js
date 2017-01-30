/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')

const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const windowStore = require('../stores/windowStore')
const dragTypes = require('../constants/dragTypes')
const cx = require('../lib/classSet')
const contextMenus = require('../contextMenus')
const {currentWindowId} = require('../../app/renderer/currentWindow')

const LongPressButton = require('./longPressButton')
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
    this.onNewTabLongPress = this.onNewTabLongPress.bind(this)
    this.wasNewTabClicked = this.wasNewTabClicked.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onTabClosedWithMouse = this.onTabClosedWithMouse.bind(this)
  }

  onMouseLeave () {
    windowActions.onTabMouseLeave({
      fixTabWidth: null
    })
  }

  onTabClosedWithMouse (rect) {
    windowActions.onTabClosedWithMouse({
      fixTabWidth: rect.width
    })
  }

  onPrevPage () {
    if (this.props.tabPageIndex === 0) {
      return
    }
    windowActions.setTabPageIndex(this.props.tabPageIndex - 1)
  }

  onNextPage () {
    if (this.props.tabPageIndex + 1 === this.totalPages) {
      return
    }
    windowActions.setTabPageIndex(this.props.tabPageIndex + 1)
  }

  get totalPages () {
    return Math.ceil(this.props.tabs.size / this.props.tabsPerTabPage)
  }

  onDrop (e) {
    appActions.dataDropped(currentWindowId)
    const clientX = e.clientX
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    if (sourceDragData) {
      // This must be executed async because the state change that this causes
      // will cause the onDragEnd to never run
      setTimeout(() => {
        const key = sourceDragData.get('key')
        let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((node) => node && node.props.tab.get('frameKey') !== key), clientX).selectedRef
        if (droppedOnTab) {
          const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)
          const droppedOnFrameProps = windowStore.getFrame(droppedOnTab.props.tab.get('frameKey'))

          // If this is a different window ID than where the drag started, then
          // the tear off will be done by tab.js
          if (this.props.dragData.get('windowId') !== currentWindowId) {
            return
          }

          windowActions.moveTab(sourceDragData, droppedOnFrameProps, isLeftSide)
          if (sourceDragData.get('pinnedLocation')) {
            appActions.tabPinned(sourceDragData.get('tabId'), false)
          }
        }
      }, 0)
      return
    }
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        const path = encodeURI(file.path)
        return appActions.createTabRequested({url: path, title: file.name})
      })
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
  wasNewTabClicked (target) {
    return target.className === this.refs.newTabButton.props.className
  }
  newTab () {
    appActions.createTabRequested({})
  }
  onNewTabLongPress (target) {
    contextMenus.onNewTabContextMenu(target)
  }
  render () {
    this.tabRefs = []
    const index = this.props.previewTabPageIndex !== undefined
      ? this.props.previewTabPageIndex : this.props.tabPageIndex
    return <div className='tabs'
      onMouseLeave={this.props.fixTabWidth ? this.onMouseLeave : null}>
      <span className={cx({
        tabStripContainer: true,
        isPreview: this.props.previewTabPageIndex !== undefined,
        allowDragging: this.props.shouldAllowWindowDrag
      })}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}>
        {(() => {
          if (index > 0) {
            return <span
              className='prevTab fa fa-caret-left'
              onClick={this.onPrevPage} />
          }
        })()}
        {
          this.props.currentTabs
            .map((tab) =>
              <Tab ref={(node) => this.tabRefs.push(node)}
                dragData={this.props.dragData}
                tab={tab}
                key={'tab-' + tab.get('frameKey')}
                paintTabs={this.props.paintTabs}
                previewTabs={this.props.previewTabs}
                isActive={this.props.activeFrameKey === tab.get('frameKey')}
                onTabClosedWithMouse={this.onTabClosedWithMouse}
                tabWidth={this.props.fixTabWidth}
                hasTabInFullScreen={this.props.hasTabInFullScreen}
                totalTabs={this.props.tabs.size}
                partOfFullPageSet={this.props.partOfFullPageSet} />)
        }
        {(() => {
          if (this.props.currentTabs.size >= this.props.tabsPerTabPage && this.totalPages > index + 1) {
            return <span
              className='nextTab fa fa-caret-right'
              onClick={this.onNextPage} />
          }
        })()}

        <LongPressButton
          ref='newTabButton'
          label='+'
          l10nId='newTabButton'
          className='browserButton navbutton newFrameButton'
          disabled={false}
          onClick={this.newTab}
          onLongPress={this.onNewTabLongPress}
        />
      </span>
    </div>
  }
}

module.exports = Tabs
