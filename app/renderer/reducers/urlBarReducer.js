/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const windowConstants = require('../../../js/constants/windowConstants')
const {getSourceAboutUrl, getSourceMagnetUrl} = require('../../../js/lib/appUrlUtil')
const {isURL, getUrlFromInput} = require('../../../js/lib/urlutil')
const {activeFrameStatePath, frameStatePath, frameStatePathForFrame, getActiveFrame, tabStatePath, getFrameByTabId} = require('../../../js/state/frameStateUtil')

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

const updateNavBarInput = (state, loc, framePath) => {
  if (framePath === undefined) {
    framePath = activeFrameStatePath(state)
  }
  state = state.setIn(framePath.concat(['navbar', 'urlbar', 'location']), loc)
  return state
}

const navigationAborted = (state, action) => {
  const frame = getFrameByTabId(state, action.tabId)
  if (frame) {
    let location = action.location || frame.get('provisionalLocation')
    if (location) {
      location = getLocation(location)
      state = updateNavBarInput(state, location)
      state = state.mergeIn(frameStatePathForFrame(state, frame), {
        location
      })
    }
  }
  return state
}

const urlBarReducer = (state, action) => {
  switch (action.actionType) {
    case windowConstants.WINDOW_SET_NAVBAR_INPUT:
      state = updateNavBarInput(state, action.location)
      break
    case windowConstants.WINDOW_SET_NAVIGATED:
      // For about: URLs, make sure we store the URL as about:something
      // and not what we map to.
      action.location = getLocation(action.location)

      const key = action.key || state.get('activeFrameKey')
      state = state.mergeIn(frameStatePath(state, key), {
        location: action.location
      })
      state = state.mergeIn(tabStatePath(state, key), {
        location: action.location
      })
      if (!action.isNavigatedInPage) {
        state = state.mergeIn(frameStatePath(state, key), {
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
        // TODO: This should be moved into a tabs reducer
        state = state.mergeIn(tabStatePath(state, key), {
          audioPlaybackActive: false,
          themeColor: undefined,
          location: action.location,
          computedThemeColor: undefined,
          icon: undefined,
          title: ''
        })
      }

      // Update nav bar unless when spawning a new tab. The user might have
      // typed in the URL bar while we were navigating -- we should preserve it.
      if (!(action.location === 'about:newtab' && !getActiveFrame(state).get('canGoForward'))) {
        const key = action.key || state.get('activeFrameKey')
        state = updateNavBarInput(state, action.location, frameStatePath(state, key))
      }
      break
    case windowConstants.WINDOW_SET_NAVIGATION_ABORTED:
      state = navigationAborted(state, action)
      break
  }
  return state
}

module.exports = urlBarReducer
