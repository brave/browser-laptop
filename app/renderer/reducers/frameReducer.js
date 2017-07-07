/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const config = require('../../../js/constants/config')
const siteTags = require('../../../js/constants/siteTags')

// Actions
const appActions = require('../../../js/actions/appActions')

// Utils
const frameStateUtil = require('../../../js/state/frameStateUtil')
const {getCurrentWindowId} = require('../currentWindow')
const {getSourceAboutUrl, getSourceMagnetUrl} = require('../../../js/lib/appUrlUtil')
const {isURL, isPotentialPhishingUrl, getUrlFromInput} = require('../../../js/lib/urlutil')
const siteUtil = require('../../../js/state/siteUtil')

const setFullScreen = (state, action) => {
  const index = frameStateUtil.getIndexByTabId(state, action.tabId)
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
  const hoverState = frameStateUtil.getTabHoverState(state, action.frameKey)

  state = state.merge(frameStateUtil.removeFrame(
    state,
    frameProps.set('closedAtIndex', index),
    index
  ))
  state = frameStateUtil.deleteFrameInternalIndex(state, frameProps)
  state = frameStateUtil.updateFramesInternalIndex(state, index)

  if (state.get('frames', Immutable.List()).size === 0) {
    appActions.closeWindow(getCurrentWindowId())
  }

  const nextFrame = frameStateUtil.getFrameByIndex(state, index)

  if (nextFrame) {
    // Copy the hover state if tab closed with mouse as long as we have a next frame
    // This allow us to have closeTab button visible for sequential frames closing,
    // until onMouseLeave event happens.
    if (hoverState) {
      state = frameStateUtil.setTabHoverState(state, nextFrame.get('key'), hoverState)
    }
  } else if (hoverState && frameStateUtil.getPreviewFrameKey(state) === action.frameKey) {
    state = frameStateUtil.setPreviewFrameKey(state, null)
  }

  return state
}

const getLocation = (location) => {
  location = location.trim()
  location = getSourceAboutUrl(location) ||
    getSourceMagnetUrl(location) ||
    location

  if (isURL(location)) {
    location = getUrlFromInput(location)
  }

  return location
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

      const hoverState = frameStateUtil.getTabHoverState(state, frame.get('key'))
      // TODO fix race condition in Muon more info in #9000
      const active = immutableAction.getIn(['tabValue', 'active'])
      if (active != null) {
        if (active) {
          state = state.set('activeFrameKey', frame.get('key'))
          if (hoverState) {
            state = state.set('previewFrameKey', null)
          }
          if (frame.getIn(['ui', 'tabs', 'hoverTabPageIndex']) == null) {
            state = state.deleteIn(['ui', 'tabs', 'previewTabPageIndex'])
          }
          state = state.setIn(['frames', index, 'lastAccessedTime'], new Date().getTime())

          state = frameStateUtil.updateTabPageIndex(state, frame)
        }
      }
      break
    case windowConstants.WINDOW_SET_NAVIGATED:
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getLocation(action.location)

      const key = action.key
      const framePath = frameStateUtil.frameStatePath(state, key)
      if (!framePath) {
        break
      }
      state = state.mergeIn(framePath, {
        location: action.location
      })
      if (!action.isNavigatedInPage) {
        state = state.mergeIn(framePath, {
          adblock: {},
          audioPlaybackActive: false,
          computedThemeColor: undefined,
          httpsEverywhere: {},
          icon: undefined,
          location: action.location,
          noScript: {},
          themeColor: undefined,
          title: '',
          trackingProtection: {},
          fingerprintingProtection: {}
        })
      }

      // For potential phishing pages, show a warning
      if (isPotentialPhishingUrl(action.location)) {
        state = state.setIn(['ui', 'siteInfo', 'isVisible'], true)
      }

      break
    case windowConstants.WINDOW_CLOSE_FRAMES:
      let closedFrames = new Immutable.List()
      action.framePropsList.forEach((frameProps) => {
        if (frameStateUtil.isValidClosedFrame(frameProps)) {
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
    case windowConstants.WINDOW_CLOSE_OTHER_FRAMES:
      const currentIndex = frameStateUtil.getIndexByTabId(state, action.tabId)
      if (currentIndex === -1) {
        return
      }

      state.get('frames').forEach((frame, i) => {
        if (!frame.get('pinnedLocation') &&
          ((i < currentIndex && action.isCloseLeft) || (i > currentIndex && action.isCloseRight))) {
          if (frame) {
            appActions.tabCloseRequested(frame.get('tabId'))
          }
        }
      })

      break
    case windowConstants.WINDOW_CLOSE_FRAME:
      state = closeFrame(state, action)
      break

    case windowConstants.WINDOW_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break

    case windowConstants.WINDOW_ON_FRAME_BOOKMARK:
      {
        // TODO make this an appAction that gets the bookmark data from tabState
        const frameProps = frameStateUtil.getFrameByTabId(state, action.tabId)
        if (frameProps) {
          const bookmark = siteUtil.getDetailFromFrame(frameProps, siteTags.BOOKMARK)
          appActions.addSite(bookmark, siteTags.BOOKMARK)
        }
        break
      }
  }

  return state
}

module.exports = frameReducer
