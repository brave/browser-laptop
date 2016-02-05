/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const WindowDispatcher = require('../dispatcher/windowDispatcher')
const WindowConstants = require('../constants/windowConstants')
const Config = require('../constants/config')
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const messages = require('../constants/messages')
const AppActions = require('./appActions')
import { getSourceAboutUrl } from '../lib/appUrlUtil'

const WindowActions = {
  /**
   * Dispatches an event to the main process to replace the window state
   *
   * @param {object} windowState - Initial window state object
   */
  setState: function (windowState) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_STATE,
      windowState
    })
  },

  /**
   * Dispatches a message to the store to load a new URL for the active frame.
   * Both the frame's src and location properties will be updated accordingly.
   *
   * If the activeFrame is a pinned site and the origin of the pinned site does
   * not match the origin of the passed in location, then a new frame will be
   * created for the load.
   *
   * In general, an iframe's src should not be updated when navigating within the frame to a new page,
   * but the location should. For user entered new URLs, both should be updated.
   *
   * @param {object} activeFrame - The frame props for the active frame
   * @param {string} location - The URL of the page to load
   */
  loadUrl: function (activeFrame, location) {
    location = location.trim()
    let newFrame = false
    if (activeFrame.get('isPinned')) {
      try {
        const origin1 = new window.URL(activeFrame.get('location')).origin
        const origin2 = new window.URL(location).origin
        if (origin1 !== origin2) {
          newFrame = true
        }
      } catch (e) {
        newFrame = true
      }
    }

    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }

    if (newFrame) {
      WindowActions.newFrame({
        location
      }, true)
      return
    } else {
      WindowDispatcher.dispatch({
        actionType: WindowConstants.WINDOW_SET_URL,
        location
      })
    }
  },

  /**
   * Dispatches a message to the store to set the current navigated location.
   * This differs from the above in that it will not change the webview's (iframe's) src.
   * This should be used for inter-page navigation but not user initiated loads.
   *
   * @param {string} location - The URL of the page to load
   * @param {number} key - The frame key to modify, it is checked against the active frame and if
   * it is active the URL text will also be changed.
   */
  setLocation: function (location, key) {
    location = location.trim()
    // For about: URLs, make sure we store the URL as about:something
    // and not what we map to.
    location = getSourceAboutUrl(location) || location

    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_LOCATION,
      location,
      key: key
    })
  },

  /**
   * Dispatches a message to set the security state.
   * @param {Object} securityState - The security state properties that have
   * changed.
   */
  setSecurityState: function (securityState) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_SECURITY_STATE,
      securityState
    })
  },

  /**
   * Dispatches a message to the store to set the user entered text for the URL bar.
   * Unlike setLocation and loadUrl, this does not modify the state of src and location.
   *
   * @param {string} location - The text to set as the new navbar URL input
   */
  setNavBarUserInput: function (location) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_NAVBAR_INPUT,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current frame's title.
   * This should be called in response to the webview encountering a <title> tag.
   *
   * @param {Object} frameProps - The frame properties to modify
   * @param {string} title - The title to set for the frame
   */
  setFrameTitle: function (frameProps, title) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_FRAME_TITLE,
      frameProps,
      title
    })
  },

  /**
   * Shows/hides the find-in-page bar.
   * @param {Object} frameProps - The frame properties to modify
   * @param {boolean} shown - Whether to show the findbar
   */
  setFindbarShown: function (frameProps, shown) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_FINDBAR_SHOWN,
      frameProps,
      shown
    })
  },

  /**
   * Sets a frame as pinned
   * @param {Object} frameProps - The frame properties to modify
   * @param {boolean} isPinned - Whether to pin or not
   */
  setPinned: function (frameProps, isPinned) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_PINNED,
      frameProps,
      isPinned
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   */
  onWebviewLoadStart: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_WEBVIEW_LOAD_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is done loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   */
  onWebviewLoadEnd: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_WEBVIEW_LOAD_END,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate if the navigation bar is focused.
   *
   * @param {boolean} focused - true if the navigation bar should be considered as focused
   */
  setNavBarFocused: function (focused) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_NAVBAR_FOCUSED,
      focused
    })
  },

  /**
   * Dispatches a message to the store to create a new frame
   *
   * @param {Object} frameOpts - An object of frame options such as isPrivate, element, and tab features.
   *                  These may not all be hooked up in Electron yet.
   * @param {boolean} openInForeground - true if the new frame should become the new active frame
   */
  newFrame: function (frameOpts = {}, openInForeground = true) {
    frameOpts.location = frameOpts.location || Config.defaultUrl
    if (frameOpts.location && UrlUtil.isURL(frameOpts.location)) {
      frameOpts.location = UrlUtil.getUrlFromInput(frameOpts.location)
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

  /**
   * Dispatches a message to close a frame
   *
   * @param {Object[]} frames - Immutable list of of all the frames
   * @param {Object} frameProps - The properties of the frame to close
   */
  closeFrame: function (frames, frameProps, forceClosePinned) {
    // Unless a caller explicitly specifies to close a pinned frame, then
    // ignore the call.
    const nonPinnedFrames = frames.filter(frame => !frame.get('isPinned'))
    if (frameProps && frameProps.get('isPinned')) {
      // Check for no frames at all, and if that's the case the user
      // only has pinned frames and tried to close, so close the
      // whole app.
      if (nonPinnedFrames.size === 0) {
        AppActions.closeWindow(remote.getCurrentWindow().id)
        return
      }

      if (!forceClosePinned) {
        // Go to next frame if the user tries to close a pinned tab
        ipc.emit(messages.SHORTCUT_NEXT_TAB)
        return
      }
    }

    const pinnedFrames = frames.filter(frame => frame.get('isPinned'))

    // If there is at least 1 pinned frame don't close the window until subsequent
    // close attempts
    if (nonPinnedFrames.size > 1 || pinnedFrames.size > 0) {
      WindowDispatcher.dispatch({
        actionType: WindowConstants.WINDOW_CLOSE_FRAME,
        frameProps
      })
    } else {
      AppActions.closeWindow(remote.getCurrentWindow().id)
    }
  },

  /**
   * Dispatches a message to the store to undo a closed frame
   * The new frame is expected to appear at the index it was last closed at
   */
  undoClosedFrame: function () {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_UNDO_CLOSED_FRAME
    })
  },

  /**
   * Dispatches an event to the main process to quit the entire application
   */
  quitApplication: function () {
    ipc.send(messages.QUIT_APPLICATION)
  },

  /**
   * Dispatches a message to the store to set a new frame as the active frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setActiveFrame: function (frameProps) {
    if (!frameProps) {
      return
    }
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_ACTIVE_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store to set a preview frame.
   * This is done when hovering over a tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setPreviewFrame: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_PREVIEW_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param {number} index - the tab page index to change to
   */
  setTabPageIndex: function (index) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_TAB_PAGE_INDEX,
      index
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param {number} frameProps - The frame props to center around
   */
  setTabPageIndexByFrame: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_TAB_PAGE_INDEX,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to update the back-forward information.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   * @param {boolean} canGoBack - Specifies if the active frame has previous entries in its history
   * @param {boolean} canGoForward - Specifies if the active frame has next entries in its history (i.e. the user pressed back at least once)
   */
  updateBackForwardState: function (frameProps, canGoBack, canGoForward) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_UPDATE_BACK_FORWARD,
      frameProps,
      canGoBack,
      canGoForward
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has started for that frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragStart: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has stopped for that frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragStop: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_STOP,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the left half of this tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragDraggingOverLeftHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_OVER_LEFT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the right half of this tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragDraggingOverRightHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_OVER_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the frame
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragExit: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_EXIT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the right half of the frame
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDragExitRightHalf: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAG_EXIT_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging started on the tab
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  tabDraggingOn: function (frameProps) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_DRAGGING_ON,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the specified frame should move locations.
   *
   * @param {Object} sourceFrameProps - the frame properties for the webview to move.
   * @param {Object} destinationFrameProps - the frame properties for the webview to move to.
   * @param {boolean} prepend - Whether or not to prepend to the destinationFrameProps
   */
  moveTab: function (sourceFrameProps, destinationFrameProps, prepend) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_TAB_MOVE,
      sourceFrameProps,
      destinationFrameProps,
      prepend
    })
  },

  /**
   * Sets the URL bar suggestions and selected index.
   *
   * @param {Object[]} suggestionList - The list of suggestions for the entered URL bar text. This can be generated from history, bookmarks, etc.
   * @param {number} selectedIndex - The index for the selected item (users can select items with down arrow on their keyboard)
   */
  setUrlBarSuggestions: function (suggestionList, selectedIndex) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS,
      suggestionList,
      selectedIndex
    })
  },

  /*
   * Sets the URL bar preview value.
   * TODO: name this something better.
   *
   * @param value If false URL bar previews will not be set.
   */
  setUrlBarPreview: function (value) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_PREVIEW,
      value
    })
  },

  /**
   * Sets the URL bar suggestion search results.
   * This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.
   * Note: This should eventually be refactored outside of the component doing XHR and into a store.
   *
   * @param searchResults The search results to set for the currently entered URL bar text.
   */
  setUrlBarSuggestionSearchResults: function (searchResults) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS,
      searchResults
    })
  },

  /**
   * Marks the URL bar text as selected or not
   *
   * @param {boolean} isSelected - Whether or not the URL bar text input should be selected
   * @param {boolean} forSearchMode - Whether or not to enable auto-complete search suggestions
   */
  setUrlBarSelected: function (selected, forSearchMode) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SELECTED,
      selected,
      forSearchMode
    })
  },

  /**
   * Marks the URL bar as active or not
   *
   * @param {boolean} isActive - Whether or not the URL bar should be marked as active
   */
  setUrlBarActive: function (isActive) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_ACTIVE,
      isActive
    })
  },

  /**
   * Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.
   *
   * @param {string} activeShortcut - The text for the new shortcut. Usually this is null to clear info which was previously
   * set from an IPC call.
   */
  setActiveFrameShortcut: function (activeShortcut) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT,
      activeShortcut
    })
  },

  /**
   * Dispatches a message to set the search engine details.
   * @param {Object} searchDetail - the search details
   */
  setSearchDetail: function (searchDetail) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_SEARCH_DETAIL,
      searchDetail
    })
  },

  /**
   * Dispatches a message to set the find-in-page details.
   * @param {Object} frameProps - Properties of the frame in question
   * @param {Object} findDetail - the find details
   */
  setFindDetail: function (frameProps, findDetail) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_FIND_DETAIL,
      frameProps,
      findDetail
    })
  },

  /**
   * Dispatches a message to indicate that the frame should be muted
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} muted - true if the frame is muted
   */
  setAudioMuted: function (frameProps, muted) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_AUDIO_MUTED,
      frameProps,
      muted
    })
  },

  /**
   * Dispatches a message to indicate that audio is playing
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} audioPlaybackActive - true if audio is playing in the frame
   */
  setAudioPlaybackActive: function (frameProps, audioPlaybackActive) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE,
      frameProps,
      audioPlaybackActive
    })
  },

  /**
   * Dispatches a message to indicate that the theme color has changed for a page
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} themeColor - Theme color of the frame
   */
  setThemeColor: function (frameProps, themeColor) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_THEME_COLOR,
      frameProps,
      themeColor
    })
  },

  /**
   * Dispatches a message to indicate that the favicon has changed
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} favicon - A url to the favicon to use
   */
  setFavicon: function (frameProps, favicon) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_FAVICON,
      frameProps,
      favicon
    })
  },

  /**
   * Dispatches a message to indicate if the mouse is in the titlebar
   *
   * @param {boolean} mouseInTitlebar - true if the mouse is in the titlebar
   */
  setMouseInTitlebar: function (mouseInTitlebar) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR,
      mouseInTitlebar
    })
  },

  /**
   * Dispatches a message to indicate the site info, such as # of blocked ads, should be shown
   *
   * @param {boolean} isVisible - true if the site info should be shown
   * @param {boolean} expandTrackingProtection - If specified, indicates if the TP section should be expanded
   * @param {boolean} expandAdblock - If specified, indicates if the adblock section should be expanded
   */
  setSiteInfoVisible: function (isVisible, expandTrackingProtection, expandAdblock) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_SITE_INFO_VISIBLE,
      isVisible,
      expandTrackingProtection,
      expandAdblock
    })
  },

  /**
   * Dispatches a message to indicate the release notes should be visible
   *
   * @param {boolean} isVisible - true if the site info should be shown
   */
  setReleaseNotesVisible: function (isVisible) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_RELEASE_NOTES_VISIBLE,
      isVisible
    })
  },

  /**
   * Dispatches a message to indicate the site info, such as # of blocked ads, should be shown
   *
   * @param {object} frameProps - The frame to set blocked info on
   * @param {string} blockType - either 'adblock' or 'trackingProtection'
   */
  setBlockedBy: function (frameProps, blockType, location) {
    WindowDispatcher.dispatch({
      actionType: WindowConstants.WINDOW_SET_BLOCKED_BY,
      frameProps,
      blockType,
      location
    })
  },

  zoomIn: function (frameProps) {
    WindowDispatcher.dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_IN
    })
  },

  zoomOut: function (frameProps) {
    WindowDispatcher.dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_OUT
    })
  },

  zoomReset: function (frameProps) {
    WindowDispatcher.dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_RESET
    })
  }
}

module.exports = WindowActions
