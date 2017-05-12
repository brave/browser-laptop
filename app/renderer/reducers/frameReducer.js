/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const windowConstants = require('../../../js/constants/windowConstants')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const appActions = require('../../../js/actions/appActions')
const windowActions = require('../../../js/actions/windowActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const config = require('../../../js/constants/config')
const {updateTabPageIndex} = require('../lib/tabUtil')
const {getCurrentWindowId} = require('../currentWindow')

const setFullScreen = (state, action) => {
  return state.mergeIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)], {
    isFullScreen: action.isFullScreen !== undefined ? action.isFullScreen : state.getIn(['frames', frameStateUtil.getFramePropsIndex(state.get('frames'), action.frameProps)].concat('isFullScreen')),
    showFullScreenWarning: action.showFullScreenWarning
  })
}

const closeFrame = (state, action) => {
  // Use the frameProps we passed in, or default to the active frame
  const frameProps = frameStateUtil.getFrameByKey(state, action.frameKey)
  const index = frameStateUtil.getFramePropsIndex(state.get('frames'), frameProps)
  if (index === -1) {
    return state
  }
  const hoverState = state.getIn(['frames', index, 'hoverState'])
  const activeFrameKey = frameStateUtil.getActiveFrame(state).get('key')
  state = state.merge(frameStateUtil.removeFrame(
    state.get('frames'),
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
    windowActions.setTabHoverState(nextFrame.get('key'), hoverState)
  }

  return state
}

const frameReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_CLOSE_FRAMES:
      let closedFrames = new Immutable.List()
      action.framePropsList.forEach((frameProps) => {
        if (!frameProps.get('isPrivate') && frameProps.get('location') !== 'about:newtab') {
          closedFrames = closedFrames.push(frameProps)
          if (closedFrames.size > config.maxClosedFrames) {
            closedFrames = closedFrames.shift()
          }
        }
      })

      closedFrames.forEach((frame) => {
        appActions.tabCloseRequested(frame.get('tabId'))
      })
      break
    case windowConstants.WINDOW_CLOSE_FRAME:
      if (action.frameKey < 0) {
        break
      }
      // Unless a caller explicitly specifies to close a pinned frame, then
      // ignore the call.
      const frames = frameStateUtil.getFrames(state)
      const nonPinnedFrames = frames.filter((frame) => !frame.get('pinnedLocation'))
      const pinnedFrames = frames.filter((frame) => frame.get('pinnedLocation'))
      // If there is at least 1 pinned frame don't close the window until subsequent
      // close attempts
      if (nonPinnedFrames.size > 1 || pinnedFrames.size > 0) {
        state = closeFrame(state, action)

        const frame = frameStateUtil.getActiveFrame(state)
        if (frame) {
          appActions.tabActivateRequested(frame.get('tabId'))
        }
      } else {
        appActions.closeWindow(getCurrentWindowId())
      }
      break

    case windowConstants.WINDOW_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break
  }

  return state
}

module.exports = frameReducer
