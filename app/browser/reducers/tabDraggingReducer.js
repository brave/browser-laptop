/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const electron = require('electron')
const appConstants = require('../../../js/constants/appConstants')
const tabState = require('../../common/state/tabState')
const tabDraggingState = require('../../common/state/tabDraggingState')
const browserWindowUtil = require('../../common/lib/browserWindowUtil')
const webContentsUtil = require('../../common/lib/webContentsUtil')
const screenUtil = require('../../common/lib/screenUtil')
const platformUtil = require('../../common/lib/platformUtil')
const { makeImmutable } = require('../../common/state/immutableUtil')
const {frameOptsFromFrame} = require('../../../js/state/frameStateUtil')
const { shouldDebugTabEvents } = require('../../cmdLine')
const tabs = require('../tabs')
const windows = require('../windows')

const isDarwin = platformUtil.isDarwin()
const isWindows = platformUtil.isWindows()
const isLinux = platformUtil.isLinux()

let moveStableHandle
let lastWindowAssignedFocus
let currentDragSourceWindow
const { BrowserWindow } = electron

function debugLog (...msg) {
  if (shouldDebugTabEvents) {
    console.log(...msg)
  }
}

function debugWrite (msg) {
  if (shouldDebugTabEvents) {
    process.stdout.write(msg)
  }
}

function relayMouseMoveToSourceWindow ({ screenX, screenY }) {
  if (currentDragSourceWindow) {
    debugLog(`Received screen mousemove`, screenX, screenY)
    const windowClientPoint = browserWindowUtil.getWindowClientPointAtScreenPoint(currentDragSourceWindow, {x: screenX, y: screenY})
    // only relay if point is outside window (otherwise OS will relay anyway)
    if (!browserWindowUtil.isClientPointWithinWindowBounds(currentDragSourceWindow, windowClientPoint)) {
      debugLog(`...relaying to source window`)
      currentDragSourceWindow.webContents.sendInputEvent(webContentsUtil.createEventForSendMouseMoveInput(windowClientPoint.x, windowClientPoint.y, ['leftButtonDown']))
    } else {
      debugLog(`... NOT relaying to source window`)
    }
  }
}

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
      const dragSourceData = action.get('dragSourceData')
      const sourceWindowId = dragSourceData.get('originalWindowId')
      const sourceWindow = BrowserWindow.fromId(sourceWindowId)
      // replace state data
      state = state.set(tabDraggingState.app.key, dragSourceData)
      debugLog('drag started from window', sourceWindowId)
      if (dragSourceData.get('originatedFromSingleTabWindow') === false) {
        // prepare buffer window for potential flash-free detach
        const bufferWindow = windows.getOrCreateBufferWindow()
        state = state.setIn([tabDraggingState.app.key, 'bufferWindowId'], bufferWindow.id)
        // move buffer window to same pos as source window
        setImmediate(() => {
          browserWindowUtil.mirrorWindowSizeAndPosition(bufferWindow, sourceWindow)
        })
      } else {
        state = state.setIn([tabDraggingState.app.key, 'dragDetachedWindowId'], sourceWindowId)
        // ignore mouse events so that we get mouseover events from any
        // tabs in other windows that the mouse is dragged over,
        // which will dispatch events to attach the dragged-tab to that
        // window, at the dragged-over tab's index
        setImmediate(() => {
          debugLog('Started with single tab window, ignoring mouse events and blurring...')
          sourceWindow.setIgnoreMouseEvents(true)
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
            sourceWindow.setAlwaysOnTop(true)
          }
        })
      }
      // Linux (Ubuntu) windows do not receive mousemove event **when mouse moves outside originating
      // window bounds**, but Windows and macOS do receive those events. It will receive mouseup though,
      // even when mouse is outside window bounds. The solution here is to manually
      // relay mousemove events when the mouse is outside the window, and luckily we do not have to
      // attempt to intercept mouseup events, which there is no API for on the browser-process side
      // anyway.
      if (isLinux) {
        currentDragSourceWindow = sourceWindow
        screenUtil.addListener('mousemove', relayMouseMoveToSourceWindow)
      }
      break
    }
    case appConstants.APP_TAB_DRAG_CANCELLED: {
      debugLog('drag cancelled')
      if (isLinux) {
        screenUtil.removeListener('mousemove', relayMouseMoveToSourceWindow)
      }
      currentDragSourceWindow = null
      // reset mouse events for window, so it now works like a normal window
      const detachedWindowId = tabDraggingState.app.getDragDetachedWindowId(state)
      if (detachedWindowId != null) {
        const detachedWindow = BrowserWindow.fromId(detachedWindowId)
        detachedWindow.setIgnoreMouseEvents(false)
        detachedWindow.setAlwaysOnTop(false)
      }
      // return to original position, original window
      // delete state data
      state = state.delete(tabDraggingState.app.key)
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
      debugLog('drag complete')
      if (isLinux) {
        screenUtil.removeListener('mousemove', relayMouseMoveToSourceWindow)
      }
      currentDragSourceWindow = null
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
        debugLog('finished drag without detached window')
      }
      // delete state data
      state = state.delete(tabDraggingState.app.key)
      const bufferWin = windows.getBufferWindow()
      if (bufferWin && bufferWin.isVisible()) {
        bufferWin.hide()
        bufferWin.setIgnoreMouseEvents(false)
      } else {
        debugLog('finished drag without buffer win visible')
      }
      // ensure buffer window exists
      windows.getOrCreateBufferWindow()
      break
    }
    // action requesting changing the index of a tab within a window
    case appConstants.APP_TAB_DRAG_CHANGE_WINDOW_DISPLAY_INDEX: {
      const dragSourceData = tabDraggingState.app.getDragData(state)
      const sourceTabId = tabDraggingState.app.getSourceTabId(state)
      if (sourceTabId == null) {
        break
      }
      const attachRequested = dragSourceData.has('attachRequestedWindowId')
      const detachRequested = dragSourceData.has('detachToRequestedWindowId')
      if (attachRequested || detachRequested) {
        break
      }
      const tabCurrentWindowId = tabDraggingState.app.getCurrentWindowId(state)
      if (action.get('senderWindowId') !== tabCurrentWindowId) {
        break
      }
      // in case resulting in new component mount (e.g. if tab dragged to new page)
      // then tell it where mouse is, since that is not accessible from DOM
      if (action.get('requiresMouseUpdate')) {
        const currentWindowId = tabState.getWindowId(state, sourceTabId)
        const win = BrowserWindow.fromId(currentWindowId)
        const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(win)
        state = state.mergeIn([tabDraggingState.app.key], {
          dragWindowClientX: cursorWindowPoint.x,
          dragWindowClientY: cursorWindowPoint.y
        })
      }
      // perform tab move
      const destinationFrameIndex = action.get('destinationFrameIndex')
      debugWrite(`POS-${sourceTabId}->${destinationFrameIndex}`)
      setImmediate(() => {
        debugWrite(`.`)
        tabs.setTabIndex(sourceTabId, destinationFrameIndex)
      })
      break
    }
    // handle tab finished attaching to existing window, or new 'detached' window
    case appConstants.APP_TAB_ATTACHED: {
      const dragSourceData = tabDraggingState.app.getDragData(state)
      const sourceTabId = tabDraggingState.app.getSourceTabId(state)
      if (!sourceTabId) {
        break
      }
      debugWrite('-oTA-')
      const attachDestinationWindowId = dragSourceData.get('attachRequestedWindowId')
      const detachToRequestedWindowId = dragSourceData.get('detachToRequestedWindowId')
      // which window is tab attached to right now
      const currentWindowId = tabState.getWindowId(state, sourceTabId)
      // handle attach to an existing window with tabs
      if (attachDestinationWindowId != null) {
        if (currentWindowId !== attachDestinationWindowId) {
          debugWrite(`WAf${currentWindowId}-t${attachDestinationWindowId}`)
          // don't do anything if still waiting for tab attach
          break
        }
        if (shouldDebugTabEvents) {
          console.timeEnd('attachRequested-torender')
        }
        debugWrite(`DA-${currentWindowId}`)
        // can continue processing drag mouse move events
        state = state.deleteIn([tabDraggingState.app.key, 'attachRequestedWindowId'])
        state = state.deleteIn([tabDraggingState.app.key, 'displayIndexRequested'])
        // forget that tab was in a 'detached' window
        state = state.deleteIn([tabDraggingState.app.key, 'dragDetachedWindowId'])
        // give the renderer some location information as the mouse may not have moved since attach.
        // In this case, the tab component can manually move the tab to where the mouse is, making any display index changes required
        const win = BrowserWindow.fromId(currentWindowId)
        const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(win)
        // store on state which window tab is now located in
        state = state.mergeIn([tabDraggingState.app.key], {
          currentWindowId,
          dragWindowClientX: cursorWindowPoint.x,
          dragWindowClientY: cursorWindowPoint.y
        })
        break
      }
      // handle detach from an existing window, and attach to a new (but likely buffered, so existing) window
      if (detachToRequestedWindowId != null) {
        // detect if we're attached to correct window yet
        // or we're getting phantom action from previous window
        // (which happens)
        if (currentWindowId !== detachToRequestedWindowId) {
          debugWrite(`WDa${currentWindowId}-t${detachToRequestedWindowId}`)
          // don't do anything, wait for the correct event
          break
        }
        if (shouldDebugTabEvents) {
          console.timeEnd('detachRequested')
        }
        debugWrite(`DDa-${currentWindowId}`)
        // can continue processing mousemove events
        state = state.deleteIn([tabDraggingState.app.key, 'detachedFromWindowId'])
        state = state.deleteIn([tabDraggingState.app.key, 'detachToRequestedWindowId'])
        state = state.deleteIn([tabDraggingState.app.key, 'displayIndexRequested'])
        // store on state which window tab is now located in
        // and that window is 'detached' and single-tab window
        state = state.mergeIn([tabDraggingState.app.key], {
          currentWindowId,
          dragDetachedWindowId: currentWindowId
        })
      }
      break
    }
    // handle dragging a tab which is the only non-pinned tab
    // in a window.
    case appConstants.APP_TAB_DRAG_SINGLE_TAB_MOVED: {
      const dragSourceData = tabDraggingState.app.getDragData(state)
      const sourceTabId = tabDraggingState.app.getSourceTabId(state)
      if (!sourceTabId) {
        // can get here because store somehow received this 'moved' action
        // before it receives the 'started' action
        break
      }
      const currentWindowId = tabDraggingState.app.getCurrentWindowId(state)
      // wait for any pending attach
      if (dragSourceData.has('attachRequestedWindowId')) {
        break
      }
      // wait for pending detach (where we do know the window id)
      if (dragSourceData.has('detachToRequestedWindowId')) {
        debugLog('not moving, detaching...')
        break
        // tab-attached action will fire, which will handle clearing this block
      }
      // check tab is actually attached to the window we think it should be
      const actualWindowId = tabState.getWindowId(state, sourceTabId)
      if (currentWindowId !== actualWindowId) {
        debugWrite(`WW-${currentWindowId}-${actualWindowId}`)
        break
      }
      // might get leftover calls from old windows just after detach
      const eventSourceWindowId = action.get('windowId')
      if (currentWindowId !== eventSourceWindowId) {
        debugWrite(`BTM-${currentWindowId}-${eventSourceWindowId}`)
        break
      }
      // move entire window, but maintain position relative to tab and mouse cursor
      // so that tab appears attached to mouse cursor
      setImmediate(async () => {
        const mouseScreenPos = electron.screen.getCursorScreenPoint()
        debugWrite('M-')
        const singleTabMoveWin = BrowserWindow.fromId(currentWindowId)
        const relativeTabX = dragSourceData.get('relativeXDragStart')
        const relativeTabY = dragSourceData.get('relativeYDragStart')
        const tabX = action.get('tabX')
        const tabY = action.get('tabY')
        const clientPosition = {
          x: tabX + relativeTabX,
          y: tabY + relativeTabY
        }
        await browserWindowUtil.moveClientPositionToMouseCursor(singleTabMoveWin, clientPosition)
        // Now we have to fix the fact that we want to detect when the mouse is 'over' a tab bar from another window
        // but the other windows / tab-bars will not receive mouse events because the 'dragged'
        // window is the window on-top / focused
        // The BrowserWindow on each different platform has different quirks to get this to work
        // properly:
        if (isDarwin) {
          // the built-in muon API works great for macOS
          singleTabMoveWin.setIgnoreMouseEvents(true)
          setImmediate(() => {
            // we have to set this feature back so that we can continue to get
            // mousemove events for the main currently-dragging window
            singleTabMoveWin.setIgnoreMouseEvents(false)
          })
        }
        if (isLinux || isWindows) {
          // Linux and Windows are much more complicated.
          // First, we use the same API to ensure mouse events are forwarded to other windows.
          // However, the OS won't actually provide the mouse event to the other window,
          // because it isn't focused.
          // So the next thing we'll do is detect which window is under the mouse cursor
          // and focus the window, forwarding the event to that window ourselves if neccessary.
          // (Disadvantage here is that odd behavior may be found if different browser windows
          // are on different virtual desktops, and they share screen coordinates.)
          moveStableHandle = moveStableHandle || setTimeout(() => {
            singleTabMoveWin.setIgnoreMouseEvents(true)
            moveStableHandle = null
          }, 40)
          let allWindows = BrowserWindow.getAllWindows()
          // forward mouse event to window if under mouse cursor pos
          // if multiple matches, then use one that has just previously matched, i.e. check the previously-matched window first
          if (lastWindowAssignedFocus != null) {
            allWindows = [ BrowserWindow.fromId(lastWindowAssignedFocus), ...allWindows ]
          }
          const sentEventToWindow = allWindows.some(otherWin => {
            // ignore window being dragged (can't overlap itself)
            if (singleTabMoveWin.id !== otherWin.id) {
              const windowClientPoint = browserWindowUtil.getWindowClientPointAtScreenPoint(otherWin, mouseScreenPos)
              if (browserWindowUtil.isClientPointWithinWindowBounds(otherWin, windowClientPoint)) {
                // essential to focus the window otherwise (in the case where the drag did not originate
                // from the dragged single-tab window), Windows will not relay the mouse event
                // Plus, we want to show a window that could potentially get a tab attach event (mouseenter)
                if (lastWindowAssignedFocus !== otherWin.id) {
                  // But, if drag didn't originate from the currently on top window
                  // and we give focus away, then we will lose ability to get mouse events from sender
                  // So, use the setAlwaysOnTop trick
                  if (tabDraggingState.app.getSourceWindowId(state) === singleTabMoveWin.id) {
                    otherWin.focus()
                  } else {
                    // bring to the top without giving focus
                    otherWin.setAlwaysOnTop(true)
                    otherWin.setAlwaysOnTop(false)
                  }
                }
                // in case of overlapping windows,
                // remember the focused window in order to prioritize it for next mousemove
                lastWindowAssignedFocus = otherWin.id
                // we only need to relay event if it's not the window
                // where the drag event started
                if (otherWin.id !== tabDraggingState.app.getSourceWindowId(state)) {
                  debugLog('sending mouse move event to other window we are dragged over', otherWin.id)
                  otherWin.webContents.sendInputEvent({
                    type: 'mousemove',
                    x: windowClientPoint.x,
                    y: windowClientPoint.y,
                    clientX: windowClientPoint.x,
                    clientY: windowClientPoint.y,
                    globalX: mouseScreenPos.x,
                    globalY: mouseScreenPos.y,
                    modifiers: ['leftButtonDown']
                  })
                } else {
                  debugLog('not sending mouse event to window we are dragged over because intersect window is drag source window', otherWin.id)
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
    // handle mousing over a tab in another window when dragging a tab
    // (attach the tab to that window, at that tab's position)
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
        debugLog('moused over a tab but not dragging in a detached window')
        break
      }
      const senderWindowId = action.get('senderWindowId')
      if (senderWindowId === detachedWindowId) {
        debugLog('moused over a tab in the same window that is being dragged')
        // TODO: stop this event, and break here
      }
      const destinationFrameIndex = action.get('frameIndex')
      // perform move
      if (destinationFrameIndex == null) {
        debugLog('did not get a valid frame index for moused over tab')
        break
      }
      const senderWindow = BrowserWindow.fromId(senderWindowId)
      const mouseScreenPos = electron.screen.getCursorScreenPoint()
      const cursorWindowPoint = browserWindowUtil.getWindowClientPointAtCursor(senderWindow, mouseScreenPos)
      state = state.mergeIn([tabDraggingState.app.key], {
        dragWindowClientX: cursorWindowPoint.x,
        dragWindowClientY: cursorWindowPoint.y,
        attachRequestedWindowId: senderWindowId,
        bufferWindowId: detachedWindowId
      })
      // get dragged frame, but set index to destination
      const frameOpts = frameOptsFromFrame(tabDraggingState.app.sourceFrame(state))
        .set('index', destinationFrameIndex)
      // existing window would be closed since it won't have any tabs left,
      // but instead let's set it up as the new Buffer Window in case we're needed again
      // and also (very importantly) to keep the drag event going since it may
      // have been the originating window
      setImmediate(() => {
        windows.setWindowIsBufferWindow(detachedWindowId)
        const detachedWindow = BrowserWindow.fromId(detachedWindowId)
        // reset mouse events for window, so it works if used for another purpose later
        detachedWindow.setIgnoreMouseEvents(false)
        detachedWindow.setAlwaysOnTop(false)
        senderWindow.focus()
        if (shouldDebugTabEvents) {
          console.time('attachRequested-toattach')
          console.time('attachRequested-torender')
        }
        tabs.moveTo(state, sourceTabId, frameOpts, {}, senderWindowId, () => {
          if (shouldDebugTabEvents) {
            console.timeEnd('attachRequested-toattach')
          }
          // make tab active when dragged to a new window
          tabs.setActive(sourceTabId)
          // Since we've got a new Buffer Window, move it in to position
          // so that it appears hidden
          // Note that we cannot actually hide that window
          // as it may have originated the drag
          // (it will be hidden when the drag operation is complete)
          browserWindowUtil.mirrorWindowSizeAndPosition(detachedWindow, senderWindow)
          // TODO: don't need the following? since already done previously...
          // reset the window being always on top, which we did
          // for Windows and Linux during detach (or start)
          if (isWindows || isLinux) {
            if (detachedWindow !== senderWindow) {
              detachedWindow.setAlwaysOnTop(false)
            }
          }
        })
      })
      break
    }
    // handle a tab in a multi-tab window being dragged past the threshold required in order
    // to request the tab be detached from the window
    case appConstants.APP_TAB_DRAG_DETACH_REQUESTED: {
      const dragSourceData = tabDraggingState.app.getDragData(state)
      const sourceTabId = tabDraggingState.app.getSourceTabId(state)
      if (!sourceTabId) {
        break
      }
      const currentWindowId = tabState.getWindowId(state, sourceTabId)
      // attach the tab to the buffer window
      const bufferWindow = windows.getOrCreateBufferWindow()
      // unmark the buffer window, since it's now a real window
      // note that if the tab is moved to another window again,
      // the window will be re-used as a buffer
      windows.clearBufferWindow(false)
      // store that we have detached,
      // so that we do not try to detach again, before detach / attach has finished
      state = state.mergeIn([tabDraggingState.app.key], {
        detachedFromWindowId: currentWindowId,
        detachToRequestedWindowId: bufferWindow.id,
        // also store coords that tab was detached from
        // so that the UI can show tab in correct position in new window
        detachedFromTabX: action.get('tabX'),
        detachedFromTabY: action.get('tabY')
      })
      // perform detach/attach
      setImmediate(() => {
        if (shouldDebugTabEvents) {
          console.time('detachRequested')
        }
        debugWrite('D-')
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
          // which is again probably when single-webview has been implemented
          setTimeout(async () => {
            // New window should already be at current window's position.
            //
            // have the window be active (as opposed to .showInactive(),
            // so that it can receive the mouseevents from the source window.
            // Upon moving the window further, we then will setIgnoreMouseEvents(true) briefly,
            // so that we relay mousemove events to any window / tab underneath the cursor
            bufferWindow.show()
            // On Windows and Linux, it's not enought to setInputEvents(false),
            // we also have to focus the other windows (see the 'move' action ^).
            // So the dragged window should always be the topmost window
            if (isWindows || isLinux) {
              bufferWindow.setAlwaysOnTop(true)
            }
            // move the detached window to the mouse cursor position
            const relativeTabX = dragSourceData.get('relativeXDragStart')
            const relativeClientY = dragSourceData.get('originClientY')
            const newPoint = await browserWindowUtil.getWindowPositionForClientPointAtCursor({
              x: relativeTabX + action.get('tabX'),
              y: relativeClientY
            })
            bufferWindow.setPosition(newPoint.x, newPoint.y, true)
          }, 50)
        })
      })
      break
    }
  }
  return state
}

module.exports = reducer
