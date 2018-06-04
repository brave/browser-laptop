/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const config = require('../../../js/constants/config')

// Actions
const appActions = require('../../../js/actions/appActions')

// Stores
const appStore = require('../../../js/stores/appStoreRenderer')

// Utils
const frameStateUtil = require('../../../js/state/frameStateUtil')
const tabDraggingState = require('../../common/state/tabDraggingState')
const {getSourceAboutUrl, getSourceMagnetUrl} = require('../../../js/lib/appUrlUtil')
const {isURL, isPotentialPhishingUrl, getUrlFromInput} = require('../../../js/lib/urlutil')
const {getCurrentWindowId} = require('../currentWindow')

const setFullScreen = (state, action) => {
  const index = frameStateUtil.getIndexByTabId(state, action.tabId)
  if (index < 0) {
    console.error('frame not found for setFullScreen: ', index)
    return state
  }
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
  const previewMode = state.getIn(['ui', 'tabs', 'previewMode'])

  state = state.merge(frameStateUtil.removeFrame(
    state,
    frameProps
      .set('closedAtIndex', index)
      .delete('openerTabId'),
    index
  ))
  state = frameStateUtil.deleteFrameInternalIndex(state, frameProps)
  state = frameStateUtil.updateFramesInternalIndex(state, index)

  const nextFrame = frameStateUtil.getFrameByIndex(state, index)

  if (nextFrame) {
    // Copy the hover state if tab closed with mouse as long as we have a next frame
    // This allow us to have closeTab button visible for sequential frames closing,
    // until onMouseLeave event happens.
    if (hoverState) {
      state = frameStateUtil
        .setTabHoverState(state, nextFrame.get('key'), hoverState, previewMode)
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

function setFrameChangedIndex (state, frame, currentIndex, newIndex) {
  let frames = frameStateUtil.getFrames(state)
  if (newIndex < 0) {
    console.error(`Cannot move frame to index ${newIndex} from ${currentIndex} because it is invalid!`)
    return state
  }
  if (newIndex >= frames.size) {
    console.error(`Cannot move frame to index ${newIndex} from ${currentIndex} because it is invalid for a frame List of size ${frames.size}!`)
    return state
  }
  // put the frame at the correct index
  frames = frames
    .splice(currentIndex, 1)
    .splice(newIndex, 0, frame)
  state = state.set('frames', frames)
  state = frameStateUtil.updateFramesInternalIndex(state, Math.min(currentIndex, newIndex))
  state = frameStateUtil.moveFrame(state, frame.get('tabId'), newIndex)

  // Since the tab could have changed pages, update the tab page as well
  const activeFrame = frameStateUtil.getActiveFrame(state)
  // avoid the race-condition of updating the tabPage
  // while active frame is not yet defined
  if (activeFrame && !tabDraggingState.app.isDragging(appStore.state)) {
    // Update tab page index to the active tab in case the active tab changed
    state = frameStateUtil.updateTabPageIndex(state, activeFrame.get('tabId'))
    // after tabPageIndex is updated we need to update framesInternalIndex too
    // TODO: really? updateTabPageIndex does not seem to change anything related
    state = frameStateUtil
      .updateFramesInternalIndex(state, Math.min(currentIndex, newIndex))
  }
  // clear preview
  state = frameStateUtil.setPreviewFrameKey(state, null)
  return state
}

const frameReducer = (state, action, immutableAction) => {
  switch (action.actionType) {
    case appConstants.APP_TAB_INSERTED_TO_TAB_STRIP: {
      const tabId = immutableAction.get('tabId')
      const index = frameStateUtil.getIndexByTabId(state, tabId)
      if (index === -1) {
        console.error(
          'frame not found for tab inserted to tab strip',
          tabId,
          (state.get('frames') || Immutable.Map()).toJS(),
          (state.get('framesInternal') || Immutable.Map()).toJS()
        )
        break
      }
      state = state.mergeIn(['frames', index], {
        tabStripWindowId: getCurrentWindowId()
      })
      state = setFrameChangedIndex(state, frameStateUtil.getFrameByIndex(state, index), index, immutableAction.get('index'))
      break
    }
    case windowConstants.WINDOW_REMOVE_FRAME:
    case appConstants.APP_TAB_CLOSED: {
      const tabId = immutableAction.get('tabId')
      const frame = frameStateUtil.getFrameByTabId(state, tabId)
      if (frame) {
        action.frameKey = frame.get('key')
        state = closeFrame(state, action)
        const activeFrame = frameStateUtil.getActiveFrame(state)
        if (activeFrame) {
          state = frameStateUtil.updateTabPageIndex(state, activeFrame.get('tabId'))
        }
      }
      break
    }
    case appConstants.APP_TAB_MOVED: {
      const tabId = immutableAction.get('tabId')
      const newIndex = immutableAction.get('toIndex')
      if (newIndex == null || newIndex === -1) {
        break
      }
      let frame = frameStateUtil.getFrameByTabId(state, tabId)
      if (!frame) {
        break
      }
      let currentIndex = frameStateUtil.getIndexByTabId(state, tabId)
      if (currentIndex == null || currentIndex === newIndex) {
        break
      }
      state = setFrameChangedIndex(state, frame, currentIndex, newIndex)
      break
    }
    case appConstants.APP_TAB_UPDATED:
      // This case will be fired for both tab creation and tab update.
      const tab = immutableAction.get('tabValue')
      const changeInfo = immutableAction.get('changeInfo') || Immutable.Map()
      if (!tab) {
        break
      }
      const tabId = tab.get('tabId')
      if (tabId === -1) {
        break
      }
      let frame = frameStateUtil.getFrameByTabId(state, tabId)
      if (!frame) {
        break
      }
      const index = tab.get('index')
      // stop being fullscreen if made inactive and was fullscreen
      if (changeInfo.get('active') === false && frame.get('isFullScreen')) {
        setImmediate(() => appActions.tabSetFullScreen(tabId, false))
      }
      // If front end doesn't know about this tabId, then do nothing!
      let sourceFrameIndex = frameStateUtil.getIndexByTabId(state, tabId)
      if (sourceFrameIndex == null) {
        break
      }
      if (index != null &&
          index !== -1 &&
          sourceFrameIndex !== index
          ) {
        const stateWithFrameMoved = setFrameChangedIndex(state, frame, sourceFrameIndex, index)
        // move forward with new index if index change was valid
        if (stateWithFrameMoved !== state) {
          sourceFrameIndex = index
          state = stateWithFrameMoved
        }
      }

      const pinned = immutableAction.getIn(['changeInfo', 'pinned'])
      if (pinned != null) {
        if (pinned) {
          state = state.setIn(['frames', sourceFrameIndex, 'pinnedLocation'], tab.get('url'))
        } else {
          state = state.deleteIn(['frames', sourceFrameIndex, 'pinnedLocation'])
        }
      }
      // handle pinned tabs that are created as pinned
      const url = immutableAction.getIn(['changeInfo', 'url'])
      if (url != null && tab.get('pinned') === true) {
        const pinnedLocation = state.getIn(['frames', sourceFrameIndex, 'pinnedLocation'])
        if (!pinnedLocation || pinnedLocation === 'about:blank' || pinnedLocation === '') {
          state = state.setIn(['frames', sourceFrameIndex, 'pinnedLocation'], tab.get('url'))
        }
      }

      const title = tab.get('title')
      if (title != null) {
        state = state.setIn(['frames', sourceFrameIndex, 'title'], title)
      }

      const active = tab.get('active')
      if (active && state.get('activeFrameKey') !== frame.get('key')) {
        state = frameStateUtil.setActiveFrameKey(state, frame.get('key'))
        state = frameStateUtil.setFrameLastAccessedTime(state, sourceFrameIndex)
        state = state.set('previewFrameKey', null)

        // Handle tabPage updates and preview cancelation based on tab updated
        // otherwise tabValue will fire those events each time a tab finish loading
        // see bug #8429
        const isNewTab = changeInfo.isEmpty()
        const activeTabHasUpdated = changeInfo.get('active') != null
        const hasBeenActivated = frame.get('hasBeenActivated')

        if (!isNewTab && activeTabHasUpdated) {
          // Show the phishing warning if we are showing a data: tab
          // for the first time
          state = state.setIn(['ui', 'siteInfo', 'isVisible'],
            !hasBeenActivated && isPotentialPhishingUrl(tab.get('url')))
        }
        if (!frame.get('hasBeenActivated')) {
          state = state.setIn(['frames', index, 'hasBeenActivated'], true)
        }
        state = frameStateUtil.updateTabPageIndex(state, tabId)
      }
      break

    case appConstants.APP_MEDIA_STARTED_PLAYING: {
      const index = frameStateUtil.getIndexByTabId(state, action.tabId)
      state = state.setIn(['frames', index, 'audioPlaybackActive'], true)
      break
    }

    case appConstants.APP_MEDIA_PAUSED: {
      const index = frameStateUtil.getIndexByTabId(state, action.tabId)
      state = state.setIn(['frames', index, 'audioPlaybackActive'], false)
      break
    }

    case windowConstants.WINDOW_SET_NAVIGATED:
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getLocation(action.location)

      const key = action.key
      const framePath = frameStateUtil.frameStatePath(state, key)
      if (!framePath) {
        break
      }
      const isNewTabUrl = action.location === 'about:newtab'
      let frameUpdateData = {
        location: action.location
      }
      if (!action.isNavigatedInPage) {
        frameUpdateData = {
          adblock: {},
          audioPlaybackActive: false,
          httpsEverywhere: {},
          icon: undefined,
          location: action.location,
          noScript: {},
          title: '',
          trackingProtection: {},
          fingerprintingProtection: {}
        }
        if (!isNewTabUrl) {
          frameUpdateData.computedThemeColor = undefined
          frameUpdateData.themeColor = undefined
        }
      }
      state = state.mergeIn(framePath, frameUpdateData)
      // For potential phishing pages, show a warning
      state = state.setIn(['ui', 'siteInfo', 'isVisible'],
        isPotentialPhishingUrl(action.location) && frameStateUtil.isFrameKeyActive(state, action.key))
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

    case appConstants.APP_TAB_SET_FULL_SCREEN:
      state = setFullScreen(state, action)
      break
    // TODO(bbondy): We should remove this window action completely and just go directly to
    // the browser process with an app action.
    case windowConstants.WINDOW_TAB_MOVE: {
      const sourceFrameIndex = frameStateUtil.getFrameIndex(state, action.sourceFrameKey)
      let newIndex = frameStateUtil.getFrameIndex(state, action.destinationFrameKey) + (action.prepend ? 0 : 1)
      if (newIndex > sourceFrameIndex) {
        newIndex--
      }
      const frame = frameStateUtil.getFrameByIndex(state, sourceFrameIndex)
      appActions.tabIndexChangeRequested(frame.get('tabId'), newIndex)
      break
    }
  }

  return state
}

module.exports = frameReducer
