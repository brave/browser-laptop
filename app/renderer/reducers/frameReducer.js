/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const appConstants = require('../../../js/constants/appConstants')
const windowActions = require('../../../js/actions/windowActions')
const windowConstants = require('../../../js/constants/windowConstants')
const frameStateUtil = require('../../../js/state/frameStateUtil')
const appActions = require('../../../js/actions/appActions')
const config = require('../../../js/constants/config')
const {updateTabPageIndex} = require('../lib/tabUtil')

const setFullScreen = (state, action) => {
  const index = frameStateUtil.getFrameIndex(state, action.frameProps.get('key'))
  return state.mergeIn(['frames', index], {
    isFullScreen: action.isFullScreen !== undefined ? action.isFullScreen : state.getIn(['frames', index].concat('isFullScreen')),
    showFullScreenWarning: action.showFullScreenWarning
  })
}

const closeFrame = (state, action) => {
  const index = frameStateUtil.getFrameIndex(state, action.frameKey)
  if (index === -1) {
    return state
  }

  const frameProps = frameStateUtil.getFrameByKey(state, action.frameKey)
  const hoverState = state.getIn(['frames', index, 'hoverState'])

  state = state.merge(frameStateUtil.removeFrame(
    state,
    frameProps.set('closedAtIndex', index),
    index
  ))
  state = frameStateUtil.deleteFrameInternalIndex(state, frameProps)
  state = frameStateUtil.updateFramesInternalIndex(state, index)

  // Copy the hover state if tab closed with mouse as long as we have a next frame
  // This allow us to have closeTab button visible  for sequential frames closing, until onMouseLeave event happens.
  const nextFrame = frameStateUtil.getFrameByIndex(state, index)
  if (hoverState && nextFrame) {
    windowActions.setTabHoverState(nextFrame.get('key'), hoverState)
  }

  return state
}

const frameReducer = (state, action, immutableAction) => {
  switch (action.actionType) {
    case appConstants.APP_TAB_UPDATED:
      const tab = immutableAction.get('tabValue')
      if (!tab) {
        break
      }
      const tabId = tab.get('tabId')
      const frame = frameStateUtil.getFrameByTabId(state, tabId)
      if (!frame) {
        break
      }

      const index = frameStateUtil.getIndexByTabId(state, tabId)
      const pinned = immutableAction.getIn(['changeInfo', 'pinned'])
      if (pinned != null) {
        if (pinned) {
          state = state.setIn(['frames', index, 'pinnedLocation'], tab.get('url'))
        } else {
          state = state.deleteIn(['frames', index, 'pinnedLocation'])
        }
      }
      // handle pinned tabs that are created as pinned
      const url = immutableAction.getIn(['changeInfo', 'url'])
      if (url != null && tab.get('pinned') === true) {
        const pinnedLocation = state.getIn(['frames', index, 'pinnedLocation'])
        if (!pinnedLocation || pinnedLocation === 'about:blank' || pinnedLocation === '') {
          state = state.setIn(['frames', index, 'pinnedLocation'], tab.get('url'))
        }
      }

      // TODO fix race condition in Muon more info in #9000
      const title = immutableAction.getIn(['tabValue', 'title'])
      if (title != null) {
        state = state.setIn(['frames', index, 'title'], title)
      }

      const active = immutableAction.getIn(['changeInfo', 'active'])
      if (active != null) {
        if (active) {
          state = state.merge({
            activeFrameKey: frame.get('key'),
            previewFrameKey: null
          })
          state = state.setIn(['frames', index, 'lastAccessedTime'], new Date().getTime())
          state = state.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
          state = updateTabPageIndex(state, frame)
        }
      }
      break
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
      state = closeFrame(state, action)
      break

    case windowConstants.WINDOW_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break
  }

  return state
}

module.exports = frameReducer
