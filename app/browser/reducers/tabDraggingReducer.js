/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const appConstants = require('../../../js/constants/appConstants')
const appActions = require('../../../js/actions/appActions')
const electron = require('electron')
const tabState = require('../../common/state/tabState')
const tabDraggingState = require('../../common/state/tabDraggingState')
const browserWindowUtil = require('../../common/lib/browserWindowUtil')
const platformUtil = require('../../common/lib/platformUtil')
const { makeImmutable } = require('../../common/state/immutableUtil')
const {frameOptsFromFrame} = require('../../../js/state/frameStateUtil')
const tabs = require('../tabs')
const windows = require('../windows')

const stateKey = 'tabDragData'
const isDarwin = platformUtil.isDarwin()
const isWindows = platformUtil.isWindows()
const isLinux = platformUtil.isLinux()

let moveStableHandle
let lastWindowAssignedFocus
const { BrowserWindow } = electron

const reducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE: {
      // in case of a crash during drag, make sure when app
      // starts, the previous drag state is discarded
      state = tabDraggingState.app.delete(state)
      break
    }
    case appConstants.APP_TAB_DRAG_STARTED: {
      // reset / initialize variables
      lastWindowAssignedFocus = null
      // calculate frame size based on difference
      // between where client reports a screen coordinate is
      // and where we think a screen coordinate would be
      const dragSourceData = action.get('dragSourceData')
      const sourceWindowId = dragSourceData.get('originalWindowId')
      const clientX = dragSourceData.get('originClientX')
      const clientY = dragSourceData.get('originClientY')
      const screenX = dragSourceData.get('originScreenX')
      const screenY = dragSourceData.get('originScreenY')
      const sourceWindow = BrowserWindow.fromId(sourceWindowId)
      const [winX, winY] = sourceWindow.getPosition()
      const frameTopHeight = screenY - clientY - winY
      const frameLeftWidth = screenX - clientX - winX
      // replace state data
      state = state.set(stateKey, dragSourceData.merge({
        frameTopHeight,
        frameLeftWidth
      }))
      console.log('drag started from window', sourceWindowId)
      if (dragSourceData.get('originatedFromSingleTabWindow') === false) {
        // prepare buffer window for potential flash-free detach
        const bufferWindow = windows.getOrCreateBufferWindow()
        state = state.setIn([stateKey, 'bufferWindowId'], bufferWindow.id)
        // move buffer window to same pos as source window
        setImmediate(() => {
          const [width, height] = sourceWindow.getSize()
          bufferWindow.setPosition(winX, winY)
          bufferWindow.setSize(width, height)
        })
      } else {
        state = state.setIn([stateKey, 'dragDetachedWindowId'], sourceWindowId)
        // ignore mouse events so that we get mouseover events from any
        // tabs in other windows that the mouse is dragged over,
        // which will dispatch events to attach the dragged-tab to that
        // window, at the dragged-over tab's index
        setImmediate(() => {
          const detachedWindow = BrowserWindow.fromId(sourceWindowId)
          console.log('Started with single tab window, ignoring mouse events and blurring...')
          detachedWindow.setIgnoreMouseEvents(true)
          // on everything but macOS, need to blur the window to have events pass through to underneath
          // Windows (OS) (and linux?) must have the window blurred in order for ignoreMouseEvents to work
          // and pass mouse events through to a window underneath, where there may be a tab
          // waiting for a mouseover event.
          // This restriction occurs only when a mousedown event has started in the source
          // window, and has not completed yet, e.g. mid-drag
          if (isWindows || isLinux) {
            // in windows (and linux), setIgnoreMouseEvents does not work too well,
            // so we need to blur the window at times.
            // If we keep the window on top, this won't be noticed
            detachedWindow.setAlwaysOnTop(true)
          }
        })
      }
      // TODO: if linux, send mouse events
      // TODO: don't close any windows if mid-drag (to keep mouse events and window buffer)
      break
    }
    case appConstants.APP_TAB_DRAG_CANCELLED: {
      console.log('drag cancelled')
      // reset mouse events for window, so it now works like a normal window
      const detachedWindowId = tabDraggingState.app.getDragDetachedWindowId(state)
      if (detachedWindowId != null) {
        const detachedWindow = BrowserWindow.fromId(detachedWindowId)
        detachedWindow.setIgnoreMouseEvents(false)
        detachedWindow.setAlwaysOnTop(false)
      }
      // return to original position, original window
      // delete state data
      state = state.delete(stateKey)
      const bufferWin = windows.getBufferWindow()
      if (bufferWin && bufferWin.isVisible()) {
        bufferWin.hide()
      }
      break
    }
    case appConstants.APP_TAB_DRAG_COMPLETE: {
      if (moveStableHandle) {
        clearTimeout(moveStableHandle)
      }
      console.log('drag complete')
      // reset mouse events for window, so it now works like a normal window
      const detachedWindowId = tabDraggingState.app.getDragDetachedWindowId(state)
      if (detachedWindowId != null) {
        const detachedWindow = BrowserWindow.fromId(detachedWindowId)
        detachedWindow.setIgnoreMouseEvents(false)
        detachedWindow.setAlwaysOnTop(false)
        detachedWindow.focus()
        // restore possible pinned tabs to detached window
        // since when we detach from being a Buffer Window,
        // we prevent the pinned tabs update at that time.
        windows.pinnedTabsChanged()
      } else {
        console.error('finished drag without detached window')
      }
      // delete state data
      state = state.delete(stateKey)
      const bufferWin = windows.getBufferWindow()
      if (bufferWin && bufferWin.isVisible()) {
        bufferWin.hide()
        bufferWin.setIgnoreMouseEvents(false)
      } else {
        console.error('finished drag without buffer win visible')
      }
      // ensure buffer window exists
      windows.getOrCreateBufferWindow()
      break
    }
    case appConstants.APP_TAB_DRAG_CHANGE_WINDOW_DISPLAY_INDEX: {
      const dragSourceData = state.get(stateKey)
      if (dragSourceData == null) {
        break
      }
      const sourceTabId = dragSourceData.get('sourceTabId')
      if (sourceTabId == null) {
        break
      }
      const attachRequested = dragSourceData.has('attachRequestedWindowId')
      const detachRequested = dragSourceData.has('detachToRequestedWindowId')
      if (attachRequested || detachRequested) {
        break
      }
      const tabCurrentWindowId = dragSourceData.get('currentWindowId')
      if (action.get('senderWindowId') !== tabCurrentWindowId) {
        break
      }
      const destinationDisplayIndex = action.get('destinationDisplayIndex')
      const destinationFrameIndex = action.get('destinationFrameIndex')
      const stateUpdate = {
        // cache what we're doing, so we don't repeat request to move tab
        // since it may take longer than it takes to fire mousemove multiple times
        displayIndexRequested: destinationDisplayIndex
      }
      // in case resulting in new component mount (e.g. if tab dragged to new page)
      // then tell it where mouse is
      if (action.get('requiresMouseUpdate')) {
        const currentWindowId = tabState.getWindowId(state, sourceTabId)
        const win = BrowserWindow.fromId(currentWindowId)
        const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(win)
        stateUpdate.dragWindowClientX = cursorWindowPoint.x
        stateUpdate.dragWindowClientY = cursorWindowPoint.y
      }
      state = state.mergeIn([stateKey], stateUpdate)
      process.stdout.write(`POS-${sourceTabId}->${destinationFrameIndex}`)
      setImmediate(() => {
        process.stdout.write(`.`)
        tabs.setTabIndex(sourceTabId, destinationFrameIndex)
      })
      break
    }
    case appConstants.APP_TAB_ATTACHED: {
      process.stdout.write('-oTA-')
      const dragSourceData = state.get(stateKey)
      if (!dragSourceData) {
        break
      }
      const sourceTabId = dragSourceData.get('sourceTabId')
      const attachDestinationWindowId = dragSourceData.get('attachRequestedWindowId')
      const detachToRequestedWindowId = dragSourceData.get('detachToRequestedWindowId')
      // which window is tab attached to right now
      const currentWindowId = tabState.getWindowId(state, sourceTabId)
      // attach to an existing window with tabs
      if (attachDestinationWindowId != null) {
        if (currentWindowId !== attachDestinationWindowId) {
          process.stdout.write(`WAf${currentWindowId}-t${attachDestinationWindowId}`)
          // don't do anything if still waiting for tab attach
          break
        }
        console.timeEnd('attachRequested-torender')
        process.stdout.write(`DA-${currentWindowId}`)
        // can continue processing drag mouse move events
        state = state.deleteIn([stateKey, 'attachRequestedWindowId'])
        state = state.deleteIn([stateKey, 'displayIndexRequested'])
        // forget that tab was in a 'detached' window
        state = state.deleteIn([stateKey, 'dragDetachedWindowId'])
        // give the renderer some location information as the mouse may not have moved since attach
        // it can manually drag the tab to where the mouse is, making any display index changes required
        const win = BrowserWindow.fromId(currentWindowId)
        const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(win)
        state = state.mergeIn([stateKey], {
          currentWindowId,
          dragWindowClientX: cursorWindowPoint.x,
          dragWindowClientY: cursorWindowPoint.y
        })
        break
      }
      // detach from an existing window, and attach to a new (but buffered, so existing) window
      if (detachToRequestedWindowId != null) {
        // detect if we're attached to correct window yet
        // or we're getting phantom action from previous window
        // (which happens)
        if (currentWindowId !== detachToRequestedWindowId) {
          process.stdout.write(`WDa${currentWindowId}-t${detachToRequestedWindowId}`)
          // don't do anything, wait for the correct event
          break
        }
        console.timeEnd('detachRequested')
        process.stdout.write(`DDa-${currentWindowId}`)
        // can continue processing mousemove events
        state = state.deleteIn([stateKey, 'detachedFromWindowId'])
        state = state.deleteIn([stateKey, 'detachToRequestedWindowId'])
        state = state.deleteIn([stateKey, 'displayIndexRequested'])
        state = state.setIn([stateKey, 'currentWindowId'], currentWindowId)
        state = state.setIn([stateKey, 'dragDetachedWindowId'], currentWindowId)
      }
      break
    }
    case appConstants.APP_TAB_DRAG_SINGLE_TAB_MOVED: {
      const dragSourceData = state.get(stateKey)
      if (!dragSourceData) {
        // can get here because store somehow received the 'moved' action
        // before it receives the 'started' action
        break
      }
      const sourceTabId = dragSourceData.get('sourceTabId')
      const currentWindowId = dragSourceData.get('currentWindowId')
      // wait for any pending attach
      if (dragSourceData.has('attachRequestedWindowId')) {
        break
      }
      // wait for any pending detach
      if (dragSourceData.has('detachRequestedWindowId')) {
        break
        // window created event will fire, which will handle clearing this block
      }
      if (dragSourceData.has('detachToRequestedWindowId')) {
        console.log('not moving, detaching...')
        break
      }
      // even though new window has been created, it may not actuall be attached to the window we think it is
      const actualWindowId = tabState.getWindowId(state, sourceTabId)
      if (currentWindowId !== actualWindowId) {
        process.stdout.write(`WW-${currentWindowId}-${actualWindowId}`)
        break
      }
      // might get leftover calls from old windows just after detach
      const eventSourceWindowId = action.get('windowId')
      if (currentWindowId !== eventSourceWindowId) {
        process.stdout.write(`BTM-${currentWindowId}-${eventSourceWindowId}`)
        break
      }
      // move entire window, but maintain position relative to tab and mouse cursor
      setImmediate(() => {
        const mouseScreenPos = electron.screen.getCursorScreenPoint()
        process.stdout.write('M-')
        // only tab, move the position by delta
        const singleTabMoveWin = BrowserWindow.fromId(currentWindowId)
        const relativeTabX = dragSourceData.get('relativeXDragStart')
        const relativeTabY = dragSourceData.get('relativeYDragStart')
        const tabX = action.get('tabX')
        const tabY = action.get('tabY')
        const frameLeftWidth = dragSourceData.get('frameLeftWidth')
        const frameTopHeight = dragSourceData.get('frameTopHeight')
        const windowY = Math.floor(mouseScreenPos.y - tabY - frameTopHeight - relativeTabY)
        const windowX = Math.floor(mouseScreenPos.x - tabX - frameLeftWidth - relativeTabX)
        singleTabMoveWin.setPosition(windowX, windowY)
        // briefly ignore mouse events so we can get the event from a tab in another window
        // underneath this one. This works well on macOS
        if (isDarwin) {
          singleTabMoveWin.setIgnoreMouseEvents(true)
          setImmediate(() => {
            singleTabMoveWin.setIgnoreMouseEvents(false)
          })
        }
        // attempt to do the same thing for linux
        if (isLinux || isWindows) {
          moveStableHandle = moveStableHandle || setTimeout(() => {
            singleTabMoveWin.setIgnoreMouseEvents(true)
            moveStableHandle = null
          }, 40)
          // also for Windows and Linux, we have to provide mouse events manually to target drag windows
          // so that their tabs can get mouseenter events, which we need in order to know where and
          // when to attach to a window
          let allWindows = BrowserWindow.getAllWindows()
          // forward mouse event to window if under mouse cursor pos
          // if multiple matches, then use one that has just previously matched, i.e. check the previously-matched window first
          if (lastWindowAssignedFocus != null) {
            allWindows = [ BrowserWindow.fromId(lastWindowAssignedFocus), ...allWindows ]
          }
          const sentEventToWindow = allWindows.some(otherWin => {
            // can't overlap ourself
            if (singleTabMoveWin.id !== otherWin.id) {
              const windowClientPoint = browserWindowUtil.getWindowClientPointAtScreenPoint(otherWin, mouseScreenPos)
              if (browserWindowUtil.isClientPointWithinWindowBounds(otherWin, windowClientPoint)) {
                // essential to focus the window otherwise (in the case where the drag did not originate
                // from the dragged single-tab window), Windows will not relay the mouse event
                // Plus, we want to show a window that could potentially get a tab attach event (mouseenter)
                //
                // But, if drag didn't originate from the currently on top window
                // and we give focus away, then we will lose ability to get mouse events from sender
                // So, use the setAlwaysOnTop trick
                if (lastWindowAssignedFocus !== otherWin.id) {
                  if (tabDraggingState.app.getSourceWindowId(state) === singleTabMoveWin.id) {
                    otherWin.focus()
                  } else {
                    otherWin.setAlwaysOnTop(true)
                    otherWin.setAlwaysOnTop(false)
                  }
                }
                // remember this window in order to prioritize it for next mousemove
                lastWindowAssignedFocus = otherWin.id
                // we only need to relay event if it's not the window
                // where the drag event started
                if (otherWin.id !== tabDraggingState.app.getSourceWindowId(state)) {
                  console.log('sending mouse move event to other window we are dragged over', otherWin.id)
                  otherWin.webContents.sendInputEvent({
                    type: 'mousemove',
                    x: windowClientPoint.x,
                    y: windowClientPoint.y,
                    clientX: windowClientPoint.x,
                    clientY: windowClientPoint.y,
                    globalX: mouseScreenPos.x,
                    globalY: mouseScreenPos.y,
                    button: 'left',
                    buttons: 1
                  })
                } else {
                  console.log('not sending mouse event to window we are dragged over because intersect window is drag source window', otherWin.id)
                }
                // problem: we have blurred the window being dragged, so unless it was the source dragevent window
                // it won't receive the mousemove, find out if:
                // - it's not receiving the event from the source window
                // - the source window is no longer sending (because *it* isn't receiving)
                return true
              }
            }
            return false
          })
          if (!sentEventToWindow) {
            // we're not dragging over another window, so clear prioritized window cache
            lastWindowAssignedFocus = null
          }
        }
      })
      break
    }
    case appConstants.APP_TAB_DRAG_MOUSEOVER_OTHER_WINDOW_TAB: {
      const dragData = tabDraggingState.app.getDragData(state)
      const sourceTabId = tabDraggingState.app.getSourceTabId(state)
      // must be dragging
      if (sourceTabId == null) {
        break
      }
      if (dragData.has('attachRequestedWindowId')) {
        break
      }
      if (dragData.has('detachToRequestedWindowId')) {
        break
      }
      // must be in a 'detached' state
      const detachedWindowId = tabDraggingState.app.getDragDetachedWindowId(state)
      if (detachedWindowId == null) {
        console.log('moused over a tab but not dragging in a detached window')
        break
      }
      const senderWindowId = action.get('senderWindowId')
      if (senderWindowId === detachedWindowId) {
        console.log('moused over a tab in the same window that is being dragged')
        // TODO: stop this event, and break here
      }
      const destinationFrameIndex = action.get('frameIndex')
      // perform move
      if (destinationFrameIndex == null) {
        console.log('did not get a valid frame index for moused over tab')
        break
      }
      const senderWindow = BrowserWindow.fromId(senderWindowId)
      const mouseScreenPos = electron.screen.getCursorScreenPoint()
      const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(senderWindow, mouseScreenPos)
      state = state.mergeIn([stateKey], {
        dragWindowClientX: cursorWindowPoint.x,
        dragWindowClientY: cursorWindowPoint.y,
        attachRequestedWindowId: senderWindowId,
        bufferWindowId: detachedWindowId
      })
      const frameOpts = frameOptsFromFrame(tabDraggingState.app.sourceFrame(state)).set('index', destinationFrameIndex)
      // use existing window for drag buffer in case we're needed again
      // and also to keep the drag event going since it may
      // have been the originating window
      setImmediate(() => {
        windows.setWindowIsBufferWindow(detachedWindowId)
        const detachedWindow = BrowserWindow.fromId(detachedWindowId)
        // reset mouse events for window, so it works if used for another purpose later
        detachedWindow.setIgnoreMouseEvents(false)
        detachedWindow.setAlwaysOnTop(false)
        senderWindow.focus()
        console.time('attachRequested-toattach')
        console.time('attachRequested-torender')
        tabs.moveTo(state, sourceTabId, frameOpts, {}, senderWindowId, () => {
          console.timeEnd('attachRequested-toattach')
          // move the buffer window so it's ready for any future detach
          // note that the buffer window is likely the single-tab window
          // that was dragged to the window the tab is now attached to
          const [ x, y ] = senderWindow.getPosition()
          const [ width, height ] = senderWindow.getSize()
          detachedWindow.setSize(width, height)
          detachedWindow.setPosition(x, y)
          // TODO: don't need the following? since already done previously...
          // reset the window being always on top, which we did
          // for Windows and Linux during detach (or start)
          if (isWindows || isLinux) {
            if (detachedWindow !== senderWindow) {
              detachedWindow.setAlwaysOnTop(false)
            }
          }
          // DO NOT hide the buffer window, as it may have originated the drag
          // ...it will be hidden when the drag operation is complete
        })
      })
      break
    }
    case appConstants.APP_TAB_DRAG_DETACH_REQUESTED: {
      const dragSourceData = state.get(stateKey)
      if (!dragSourceData) {
        break
      }
      const sourceTabId = dragSourceData.get('sourceTabId')
      const currentWindowId = tabState.getWindowId(state, sourceTabId)
      // attach the tab to the buffer window
      const bufferWindow = windows.getOrCreateBufferWindow()
      // unmark the buffer window, since it's now a real window
      // note that if the tab is moved to another window again,
      // the window will be re-used as a buffer
      windows.clearBufferWindow(false)
      setImmediate(() => {
        console.time('detachRequested')
        process.stdout.write('D-')
        const browserOpts = {
          checkMaximized: false
        }
        const frameOpts = frameOptsFromFrame(dragSourceData.get('frame'))
        tabs.moveTo(state, sourceTabId, frameOpts, browserOpts, bufferWindow.id, () => {
          // window should already be sized and positioned
          // exactly like the window we are detaching from
          // but we should animate so that the tab is where the mouse is
          // since there will have been some movement in order to detach
          // TODO: when cross-window webview guest instance sharing is working, have the buffer window
          // always show the current dragged guest instance, so it's ready to show instantly
          // TODO: remove this timeout when the browser window
          // can more instantly render the active frame
          // probably when it is single-webview
          setTimeout(() => {
            // new window should already be at current window's position
            // as that is sent on drag start, or attach to new window
            // give focus to the detached window so it acts on the mouse events
            // even thought they're being sent from the original window
            //
            // have the window be active, so that it can receive the mouseevents from the source window
            // it then will setIgnoreMouseEvents briefly, during window move, to relay mousemove events
            // to any window / tab underneath the cursor
            bufferWindow.show()
            // On Windows and Linux, it's not enought to setInputEvents(false),
            // we also have to focus the other windows. So the dragged window
            // should always be the topmost window
            if (isWindows || isLinux) {
              bufferWindow.setAlwaysOnTop(true)
            }
            // move the detached window to the mouse cursor position
            const relativeTabX = dragSourceData.get('relativeXDragStart')
            const relativeClientY = dragSourceData.get('originClientY')
            const newPoint = browserWindowUtil.getWindowPositionForClientPointAtCursor({
              x: relativeTabX + action.get('tabX'),
              y: relativeClientY
            })
            bufferWindow.setPosition(newPoint.x, newPoint.y, true)
          }, 50)
        })
      })
      // remember that we have asked for a new window,
      // so that we do not try to create again
      const props = {
        detachedFromTabX: action.get('tabX'),
        detachedFromTabY: action.get('tabY'),
        detachedFromWindowId: currentWindowId,
        detachToRequestedWindowId: bufferWindow.id
      }
      // TODO: if we have to abandon idea of buffer window
      // then set detachRequestedWindowId: currentWindowId
      state = state.mergeIn([stateKey], props)
      break
    }
  }
  return state
}

module.exports = reducer
