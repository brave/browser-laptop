/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const throttle = require('lodash.throttle')
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const appActions = require('../../../js/actions/appActions')
// const windowActions = require('../../../js/actions/windowActions')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const {getCurrentWindowId} = require('../currentWindow')
const browserWindowUtil = require('../../common/lib/browserWindowUtil')
const webContentsUtil = require('../../common/lib/webContentsUtil')
const {getSetting} = require('../../../js/settings')
const settings = require('../../../js/constants/settings')
const tabDraggingState = require('../../common/state/tabDraggingState')

module.exports = function (windowState, action) {
  switch (action.actionType) {
    // from initial window
    case appConstants.APP_TAB_DRAG_STARTED:
      setupDragContinueEvents()
      break
    // from initial or destination window
    // translate display index of tab to frame index to move the dragged tab to
    // since the app state unfortunately does not have access to that data
    // as we should take in to account pinned and tab group page index
    case windowConstants.WINDOW_TAB_DRAG_CHANGE_GROUP_DISPLAY_INDEX:
      let { isPinnedTab, destinationIndex } = action
      // translate to actual index, because it's not really linear under the hood
      const frameGroup = isPinnedTab ? frameStateUtil.getPinnedFrames(windowState) : frameStateUtil.getNonPinnedFrames(windowState)
      const destinationFrame = frameGroup.get(destinationIndex)
      if (!destinationFrame) {
        console.error(`Tried to drag to frame position ${destinationIndex} which does not exist`)
        break
      }
      const destinationFrameIndex = frameStateUtil.getFrameIndex(windowState, destinationFrame.get('key'))
      let pageChange = false
      // make sure we change displayed tab page for destination index
      if (!isPinnedTab) {
        const pageIndex = frameStateUtil.getTabPageIndex(windowState)
        const tabsPerTabPage = Number(getSetting(settings.TABS_PER_PAGE))
        const destinationPageIndex = Math.floor(destinationFrameIndex / tabsPerTabPage)
        if (destinationPageIndex !== pageIndex) {
          pageChange = true
          windowState = windowState.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
          windowState = windowState.setIn(['ui', 'tabs', 'tabPageIndex'], destinationPageIndex)
        }
      }
      setImmediate(() => {
        appActions.tabDragChangeWindowDisplayIndex(destinationFrameIndex, pageChange)
      })
      break
    case windowConstants.WINDOW_TAB_DRAG_PAUSING_FOR_PAGE_CHANGE:
      windowState = tabDraggingState.window.setPausingForPageIndexChange(windowState, action.pageIndex)
      break
    case windowConstants.WINDOW_TAB_DRAG_NOT_PAUSING_FOR_PAGE_CHANGE:
      windowState = tabDraggingState.window.clearPausingForPageIndexChange(windowState)
      break
    case appConstants.APP_TAB_MOVED:
      console.log('tab moved')
      // TODO: change tab page to match where dragged tab is
      break
  }
  return windowState
}

/// For when this tab / window is the dragging source
/// dispatch the events to the store so that the
/// other windows can receive state update of where to put the tab
function setupDragContinueEvents () {
  const stopDragListeningEvents = () => {
    window.removeEventListener('mouseup', onTabDragComplete)
    window.removeEventListener('keydown', onTabDragCancel)
    window.removeEventListener('mousemove', onTabDragMove)
  }
  const onTabDragComplete = e => {
    stopDragListeningEvents()
    appActions.tabDragComplete()
  }
  const onTabDragCancel = e => {
    if (e.keyCode === 27) { // ESC key
      stopDragListeningEvents()
      appActions.tabDragCancelled()
    }
  }
  const onTabDragMove = mouseMoveEvent => {
    mouseMoveEvent.preventDefault()
    if (mouseMoveEvent.buttons) {
      // only continue drag move event if button is still down
      reportMoveToOtherWindow(mouseMoveEvent)
    } else {
      console.error('got mouse move without button, so ending', getCurrentWindowId(), mouseMoveEvent)
      // sometimes, on Windows (OS), when tab has been moved to another
      // window and that window has focus, we do not receive mouseup
      // even through we receive mousemove
      // So, if the mouse is up, finish the drag event
      onTabDragComplete()
    }
  }
  window.addEventListener('mouseup', onTabDragComplete)
  window.addEventListener('keydown', onTabDragCancel)
  window.addEventListener('mousemove', onTabDragMove)
}

/// HACK Even if the other window is 'active', it will not receive regular mousemove events
/// ...probably because there is another mousemove event in progress generated from another
/// window.
/// So send the mouse events using muon's BrowserWindow.sendInputEvent
/// This was previously done in the browser process as a result of the 'dragMoved' store action
/// but it was never smooth enough, even when reducing the throttle time
const reportMoveToOtherWindow = throttle(mouseMoveEvent => {
  // HACK we cannot get the new window ID (tabDragData.currentWindowId) from the store state
  // when we are dragged to another window since our component will
  // not be subscribed to store updates anymore as technically it
  // does not exist, so...
  // ...get the currently focused window... if this is flakey we could subscribe to the store
  // manually (and probably create another higher order component for all this to preserve sanity)
  const win = electron.remote.BrowserWindow.getActiveWindow()
  if (!win || win.id === getCurrentWindowId()) {
    return
  }
  const {x: clientX, y: clientY} = browserWindowUtil.getWindowClientPointAtCursor(win, {
    x: mouseMoveEvent.screenX,
    y: mouseMoveEvent.screenY
  })
  win.webContents.sendInputEvent(webContentsUtil.createEventForSendMouseMoveInput(clientX, clientY, ['leftButtonDown']))
}, 4)
