/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const windowConstants = require('../../../js/constants/windowConstants')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const siteUtil = require('../../../js/state/siteUtil')
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const {updateTabPageIndex} = require('../lib/tabUtil')
const {currentWindowId} = require('../currentWindow')
const messages = require('../../../js/constants/messages')

const setFullScreen = (state, action) => {
  return state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)], {
    isFullScreen: action.isFullScreen !== undefined ? action.isFullScreen : state.getIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)].concat('isFullScreen')),
    showFullScreenWarning: action.showFullScreenWarning
  })
}

const closeFrame = (state, action) => {
  // Use the frameProps we passed in, or default to the active frame
  const frameProps = action.frameProps || frameStateUtil.getActiveFrame(state)
  const index = frameStateUtil.getFramePropsIndex(state.get('frames'), frameProps)
  const hoverState = state.getIn(['frames', index, 'hoverState'])
  const activeFrameKey = frameStateUtil.getActiveFrame(state).get('key')
  state = state.merge(frameStateUtil.removeFrame(
    state.get('frames'),
    state.get('tabs'),
    state.get('closedFrames'),
    frameProps.set('closedAtIndex', index),
    activeFrameKey,
    index,
    getSetting(settings.TAB_CLOSE_ACTION)
  ))
  // If we reach the limit of opened tabs per page while closing tabs, switch to
  // the active tab's page otherwise the user will hang on empty page
  if (frameStateUtil.getNonPinnedFrameCount(state) % getSetting(settings.TABS_PER_PAGE) === 0) {
    state = updateTabPageIndex(state, frameStateUtil.getActiveFrame(state))
    state = state.deleteIn(['ui', 'tabs', 'fixTabWidth'])
  }

  const nextFrame = frameStateUtil.getFrameByIndex(state, index)

  // Copy the hover state if tab closed with mouse as long as we have a next frame
  // This allow us to have closeTab button visible  for sequential frames closing, until onMouseLeave event happens.
  if (hoverState && nextFrame) {
    windowActions.setTabHoverState(nextFrame, hoverState)
  }

  return state
}

const frameReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_CLOSE_FRAMES:
      const activeFrameKey = state.get('activeFrameKey')
      const activeFrame = frameStateUtil.findFrameInList(action.framePropsList, activeFrameKey)

      if (activeFrame) {
        const origin = siteUtil.getOrigin(activeFrame.get('location'))
        if (origin) {
          appActions.clearNotifications(origin)
        }

        // If the frame was full screen, exit
        if (activeFrame && activeFrame.get('isFullScreen')) {
          state = setFullScreen(state, {
            frameProps: activeFrame,
            isFullScreen: false
          })
        }
      }

      state = state.merge(frameStateUtil.removeFrames(
        state.get('frames'),
        state.get('tabs'),
        state.get('closedFrames'),
        action.framePropsList,
        activeFrame,
        state.get('activeFrameKey'),
        getSetting(settings.TAB_CLOSE_ACTION)
      ))

      state = updateTabPageIndex(state, frameStateUtil.getActiveFrame(state))
      state = state.deleteIn(['ui', 'tabs', 'fixTabWidth'])
      break

    case windowConstants.WINDOW_CLOSE_FRAME:
      const ipc = electron.ipcRenderer
      const origin = siteUtil.getOrigin(action.frameProps.get('location'))
      if (origin) {
        appActions.clearNotifications(origin)
      }
      // If the frame was full screen, exit
      if (action.frameProps && action.frameProps.get('isFullScreen')) {
        state = setFullScreen(state, {
          frameProps: action.frameProps,
          isFullScreen: false
        })
      }
      // Unless a caller explicitly specifies to close a pinned frame, then
      // ignore the call.
      const nonPinnedFrames = action.frames.filter((frame) => !frame.get('pinnedLocation'))
      if (action.frameProps && action.frameProps.get('pinnedLocation')) {
        // Check for no frames at all, and if that's the case the user
        // only has pinned frames and tried to close, so close the
        // whole app.
        if (nonPinnedFrames.size === 0) {
          appActions.closeWindow(currentWindowId)
          return state
        }

        const frameKey = action.frameProps ? action.frameProps.get('key') : null
        const activeFrameKey = state.get('activeFrameKey')

        if (!action.forceClosePinned && frameKey === activeFrameKey) {
          // Go to next frame if the user tries to close a pinned tab
          ipc.emit(messages.SHORTCUT_NEXT_TAB)
          return state
        }
      }

      const pinnedFrames = action.frames.filter((frame) => frame.get('pinnedLocation'))
      // If there is at least 1 pinned frame don't close the window until subsequent
      // close attempts
      if (nonPinnedFrames.size > 1 || pinnedFrames.size > 0) {
        state = closeFrame(state, action)
      } else {
        appActions.closeWindow(currentWindowId)
      }
      break

    case windowConstants.WINDOW_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break
  }

  return state
}

module.exports = frameReducer
