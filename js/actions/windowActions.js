/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const AppDispatcher = require('../dispatcher/appDispatcher')
const windowConstants = require('../constants/windowConstants')
const appActions = require('../actions/appActions')
const messages = require('../constants/messages')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')
const UrlUtil = require('../lib/urlutil')
const {currentWindow} = require('../../app/renderer/currentWindow')
const windowStore = require('../stores/windowStore')

function dispatch (action) {
  AppDispatcher.dispatch(action)
}

const windowActions = {

  /**
   * Dispatches an event to the main process to replace the window state
   *
   * @param {object} windowState - Initial window state object
   */
  setState: function (windowState) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_STATE,
      windowState
    })
  },

  /**
   * Dispatches a message to the store to load a new URL.
   * Both the frame's src and location properties will be updated accordingly.
   *
   * If the frame is a pinned site and the origin of the pinned site does
   * not match the origin of the passed in location, then a new frame will be
   * created for the load.
   *
   * In general, an iframe's src should not be updated when navigating within the frame to a new page,
   * but the location should. For user entered new URLs, both should be updated.
   *
   * @param {object} frame - The frame props
   * @param {string} location - The URL of the page to load
   */
  loadUrl: function (frame, location) {
    location = location.trim()
    let newFrame = false
    if (frame.get('pinnedLocation') && location !== 'about:certerror' &&
        frame.get('location') !== 'about:certerror' &&
        location !== 'about:error' &&
        frame.get('location') !== 'about:error') {
      try {
        const origin1 = new window.URL(frame.get('location')).origin
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
      this.newFrame({
        location
      }, true)
    } else {
      this.setUrl(location, frame.get('key'))
    }
  },

  /**
   * Dispatches a message to the store to set the new URL.
   * @param {string} location
   * @param {number} key
   */
  setUrl: function (location, key) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_URL,
      location,
      key
    })
  },

  /**
   * Dispatches a message to the store to let it know a page has been navigated.
   *
   * @param {string} location - The URL of the page that was navigated to.
   * @param {number} key - The frame key to modify.
   * @param {boolean} isNavigatedInPage - true if it was a navigation within the same page.
   * @param {number} tabId - the tab id
   */
  setNavigated: function (location, key, isNavigatedInPage, tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_NAVIGATED,
      location,
      key,
      isNavigatedInPage,
      tabId
    })
  },

  /**
   * Dispatches a message to set the security state.
   * @param {Object} frameProps - The frame properties to modify.
   * @param {Object} securityState - The security state properties that have
   *   changed.
   */
  setSecurityState: function (frameProps, securityState) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_SECURITY_STATE,
      securityState,
      frameProps
    })
  },

  /**
   * Dispatches a message to set the frame tab id
   * @param {Object} frameProps - The frame properties
   * @param {Number} tabId - the tab id to set
   */
  setFrameTabId: function (frameProps, tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FRAME_TAB_ID,
      frameProps,
      tabId
    })
  },

  /**
   * Dispatches a message to set the frame error state
   * @param {Object} frameProps - The frame properties
   * @param {Object} errorDetails - The error properties
   *   changed.
   */
  setFrameError: function (frameProps, errorDetails) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FRAME_ERROR,
      frameProps,
      errorDetails
    })
  },

  /**
   * Dispatches a message to the store to set the user entered text for the URL bar.
   * Unlike setLocation and loadUrl, this does not modify the state of src and location.
   *
   * @param {string} location - The text to set as the new navbar URL input
   */
  setNavBarUserInput: function (location) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_NAVBAR_INPUT,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current frame's title.
   * This should be called in response to the webview encountering a `<title>` tag.
   *
   * @param {Object} frameProps - The frame properties to modify
   * @param {string} title - The title to set for the frame
   */
  setFrameTitle: function (frameProps, title) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FRAME_TITLE,
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
    dispatch({
      actionType: windowConstants.WINDOW_SET_FINDBAR_SHOWN,
      frameProps,
      shown
    })
  },

  /**
   * Highlight text in the findbar
   * @param {Object} frameProps - The frame properties to modify
   * @param {boolean} selected - Whether to select the findbar search text
   */
  setFindbarSelected: function (frameProps, selected) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FINDBAR_SELECTED,
      frameProps,
      selected
    })
  },

  /**
   * Sets a frame as pinned
   * @param {Object} frameProps - The frame properties to modify
   * @param {boolean} isPinned - Whether to pin or not
   */
  setPinned: function (frameProps, isPinned) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_PINNED,
      frameProps,
      isPinned
    })
    const siteDetail = siteUtil.getDetailFromFrame(frameProps, siteTags.PINNED)
    if (isPinned) {
      appActions.addSite(siteDetail, siteTags.PINNED)
    } else {
      appActions.removeSite(siteDetail, siteTags.PINNED)
    }
  },

  /**
   * Dispatches a message to the store to indicate that the webview is loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   * @param {string} location - The location being loaded.
   */
  onWebviewLoadStart: function (frameProps, location) {
    dispatch({
      actionType: windowConstants.WINDOW_WEBVIEW_LOAD_START,
      frameProps,
      location
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is done loading.
   *
   * @param {Object} frameProps - The frame properties for the webview in question.
   */
  onWebviewLoadEnd: function (frameProps) {
    dispatch({
      actionType: windowConstants.WINDOW_WEBVIEW_LOAD_END,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview entered full screen mode.
   *
   * @param {Object} frameProps - The frame properties to put in full screen
   * @param {boolean} isFullScreen - true if the webview is entering full screen mode.
   * @param {boolean} showFullScreenWarning - true if a warning about entering full screen should be shown.
   */
  setFullScreen: function (frameProps, isFullScreen, showFullScreenWarning) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FULL_SCREEN,
      frameProps,
      isFullScreen,
      showFullScreenWarning
    })
  },

  /**
   * Dispatches a message to the store to create a new frame
   *
   * @param {Object} frameOpts - An object of frame options such as isPrivate, element, and tab features.
   *                  These may not all be hooked up in Electron yet.
   * @param {boolean} openInForeground - true if the new frame should become the new active frame
   */
  newFrame: function (frameOpts, openInForeground) {
    dispatch({
      actionType: windowConstants.WINDOW_NEW_FRAME,
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
    const ipc = require('electron').ipcRenderer
    const origin = siteUtil.getOrigin(frameProps.get('location'))
    if (origin) {
      appActions.clearMessageBoxes(origin)
    }
    // If the frame was full screen, exit
    if (frameProps && frameProps.get('isFullScreen')) {
      this.setFullScreen(frameProps, false)
    }
    // Unless a caller explicitly specifies to close a pinned frame, then
    // ignore the call.
    const nonPinnedFrames = frames.filter((frame) => !frame.get('pinnedLocation'))
    if (frameProps && frameProps.get('pinnedLocation')) {
      // Check for no frames at all, and if that's the case the user
      // only has pinned frames and tried to close, so close the
      // whole app.
      if (nonPinnedFrames.size === 0) {
        appActions.closeWindow(currentWindow.id)
        return
      }

      const frameKey = frameProps ? frameProps.get('key') : null
      const activeFrameKey = windowStore.getState().get('activeFrameKey')
      const isActiveFrame = frameKey === activeFrameKey

      if (!forceClosePinned && isActiveFrame) {
        // Go to next frame if the user tries to close a pinned tab
        ipc.emit(messages.SHORTCUT_NEXT_TAB)
        return
      }
    }

    const pinnedFrames = frames.filter((frame) => frame.get('pinnedLocation'))

    // If there is at least 1 pinned frame don't close the window until subsequent
    // close attempts
    if (nonPinnedFrames.size > 1 || pinnedFrames.size > 0) {
      dispatch({
        actionType: windowConstants.WINDOW_CLOSE_FRAME,
        frameProps
      })
    } else {
      appActions.closeWindow(currentWindow.id)
    }
  },

  /**
   * Dispatches a message to the store to undo a closed frame
   * The new frame is expected to appear at the index it was last closed at
   */
  undoClosedFrame: function () {
    dispatch({
      actionType: windowConstants.WINDOW_UNDO_CLOSED_FRAME
    })
  },

  /**
   * Dispatches a message to the store to clear closed frames
   */
  clearClosedFrames: function () {
    dispatch({
      actionType: windowConstants.WINDOW_CLEAR_CLOSED_FRAMES
    })
  },

  /**
   * Dispatches a message to the store to set a new frame as the active frame.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setActiveFrame: function (frameProps) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_ACTIVE_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store when the frame is active and the window is focused
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setFocusedFrame: function (frameProps) {
    if (frameProps) {
      dispatch({
        actionType: windowConstants.WINDOW_SET_FOCUSED_FRAME,
        frameProps: frameProps
      })
    }
  },

  /**
   * Dispatches a message to the store to set a preview frame.
   * This is done when hovering over a tab.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   */
  setPreviewFrame: function (frameProps) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_PREVIEW_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param {number} index - the tab page index to change to
   */
  setTabPageIndex: function (index) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_PAGE_INDEX,
      index
    })
  },

  /**
   * Dispatches a message to the store to set the tab breakpoint.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   * @param {string} breakpoint - the tab breakpoint to change to
   */
  setTabBreakpoint: function (frameProps, breakpoint) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_BREAKPOINT,
      frameProps,
      breakpoint
    })
  },

  /**
   * Dispatches a message to the store to set the current tab hover state.
   *
   * @param {Object} frameProps - the frame properties for the webview in question.
   * @param {boolean} hoverState - whether or not mouse is over tab
   */
  setTabHoverState: function (frameProps, hoverState) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_HOVER_STATE,
      frameProps,
      hoverState
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index being previewed.
   *
   * @param {number} previewTabPageIndex - The tab page index to preview
   */
  setPreviewTabPageIndex: function (previewTabPageIndex) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_PREVIEW_TAB_PAGE_INDEX,
      previewTabPageIndex
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param {number} frameProps - The frame props to center around
   */
  setTabPageIndexByFrame: function (frameProps) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_PAGE_INDEX,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over this item.
   *
   * @param {string} dragType - The type of drag operation being performed
   * @param {Object} dragOverKey - A unique identifier for the storage for the item being dragged over
   * @param {Object} dragDetail - detail about the item drag operation
   */
  setIsBeingDraggedOverDetail: function (dragType, dragOverKey, dragDetail) {
    dispatch({
      dragType,
      actionType: windowConstants.WINDOW_SET_IS_BEING_DRAGGED_OVER_DETAIL,
      dragOverKey,
      dragDetail
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
    dispatch({
      actionType: windowConstants.WINDOW_TAB_MOVE,
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
    dispatch({
      actionType: windowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS,
      suggestionList,
      selectedIndex
    })
  },

  /**
   * The active URL bar suggestion was clicked
   * @param {boolean} isForSecondaryAction - Whether the secondary action is expected
   *  which happens when a modifier key is pressed.
   * @param {boolean} shiftKey - Whether the shift key is being pressed
   */
  activeSuggestionClicked: function (isForSecondaryAction, shiftKey) {
    dispatch({
      actionType: windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED,
      isForSecondaryAction,
      shiftKey
    })
  },

  /**
   * The previous suggestion is being selected
   */
  previousUrlBarSuggestionSelected: function () {
    dispatch({
      actionType: windowConstants.WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED
    })
  },

  /**
   * The next suggestion is being selected
   */
  nextUrlBarSuggestionSelected: function () {
    dispatch({
      actionType: windowConstants.WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED
    })
  },

  /**
   * autocomplete for urlbar is being enabled or disabled.
   * Autocomplete is defined to be the action of inserting text into the urlbar itself
   * to the first item's URL match if possible.  The inserted text is auto selected so
   * that the next character inserted will replace it.
   * This is sometimes only temporarily disabled, e.g. a user is pressing backspace.
   *
   * @param {boolean} enabled - true if the urlbar should autocomplete
   */
  urlBarAutocompleteEnabled: function (enabled) {
    dispatch({
      actionType: windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED,
      enabled
    })
  },

  /*
   * Sets if we should render URL bar suggestions.
   *
   * @param enabled If false URL bar suggestions will not be rendered.
   */
  setRenderUrlBarSuggestions: function (enabled) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS,
      enabled
    })
  },

  /**
   * New URL bar suggestion search results are available.
   * This is typically from a service like Duck Duck Go auto complete for the portion of text that the user typed in.
   *
   * @param {number} tabId - the tab id for the action
   * @param searchResults The search results for the currently entered URL bar text.
   */
  searchSuggestionResultsAvailable: function (tabId, searchResults) {
    dispatch({
      actionType: windowConstants.WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE,
      tabId,
      searchResults
    })
  },

  /**
   * Marks the URL bar text as selected or not
   *
   * @param {boolean} isSelected - Whether or not the URL bar text input should be selected
   */
  setUrlBarSelected: function (selected) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_URL_BAR_SELECTED,
      selected
    })
  },

  /**
   * Marks the URL bar as active or not.
   * If the URL bar is active that means it's in a position that it should be displaying
   * autocomplete.  It may choose not to display autocomplete and still be active if there
   * are no autocomplete results.
   *
   * @param {boolean} isActive - Whether or not the URL bar should be marked as active
   */
  setUrlBarActive: function (isActive) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_URL_BAR_ACTIVE,
      isActive
    })
  },

  /**
   * Marks the URL bar as focused or not.
   *
   * @param {boolean} isFocused - Whether or not the URL bar should be marked as focused
   */
  setUrlBarFocused: function (isFocused) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_URL_BAR_FOCUSED,
      isFocused
    })
  },
  /**
   * Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} activeShortcut - The text for the new shortcut. Usually this is null to clear info which was previously
   * set from an IPC call.
   * @param {string} activeShortcutDetails - Parameters for the shortcut action
   */
  setActiveFrameShortcut: function (frameProps, activeShortcut, activeShortcutDetails) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT,
      frameProps,
      activeShortcut,
      activeShortcutDetails
    })
  },

  /**
   * Dispatches a message to set the search engine details.
   * @param {Object} searchDetail - the search details
   */
  setSearchDetail: function (searchDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_SEARCH_DETAIL,
      searchDetail
    })
  },

  /**
   * Dispatches a message to set the find-in-page details.
   * @param {Object} frameProps - Properties of the frame in question
   * @param {Object} findDetail - the find details
   */
  setFindDetail: function (frameProps, findDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FIND_DETAIL,
      frameProps,
      findDetail
    })
  },

  /**
   * Dispatches a message to set add/edit bookmark details
   * If set, also indicates that add/edit is shown
   * @param {Object} currentDetail - Properties of the bookmark to change to
   * @param {Object} originalDetail - Properties of the bookmark to edit
   * @param {Object} destinationDetail - Will move the added bookmark to the specified position
   * @param {boolean} shouldShowLocation - Whether or not to show the URL input
   * @param {boolean} isBookmarkHanger - true if triggered from star icon in nav bar
   */
  setBookmarkDetail: function (currentDetail, originalDetail, destinationDetail, shouldShowLocation, isBookmarkHanger) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BOOKMARK_DETAIL,
      currentDetail,
      originalDetail,
      destinationDetail,
      shouldShowLocation,
      isBookmarkHanger
    })
  },

  /**
   * Dispatches a message to set context menu detail.
   * If set, also indicates that the context menu is shown.
   * @param {Object} detail - The context menu detail
   */
  setContextMenuDetail: function (detail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL,
      detail
    })
  },

  /**
   * Dispatches a message to set popup window detail.
   * If set, also indicates that the popup window is shown.
   * @param {Object} detail - The popup window detail
   */
  setPopupWindowDetail: function (detail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_POPUP_WINDOW_DETAIL,
      detail
    })
  },

  /**
   * Dispatches a message to indicate that the frame should be muted
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} muted - true if the frame is muted
   */
  setAudioMuted: function (frameProps, muted) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUDIO_MUTED,
      frameProps,
      muted
    })
  },

  /**
   * Dispatches a mute/unmute call to all frames in a provided list (used by TabList).
   *
   * @param {Object} framePropsList - List of frame properties to consider
   * @param {boolean} muted - true if the frames should be muted
   */
  muteAllAudio: function (framePropsList, mute) {
    framePropsList.forEach((frameProps) => {
      if (mute && frameProps.get('audioPlaybackActive') && !frameProps.get('audioMuted')) {
        this.setAudioMuted(frameProps, true)
      } else if (!mute && frameProps.get('audioMuted')) {
        this.setAudioMuted(frameProps, false)
      }
    })
  },

  /**
   * Dispatches a mute call to all frames except the one provided.
   * The provided frame will have its audio unmuted.
   *
   * @param {Object} frameToSkip - Properties of the frame to keep audio
   */
  muteAllAudioExcept: function (frameToSkip) {
    let framePropsList = windowStore.getState().get('frames')

    framePropsList.forEach((frameProps) => {
      if (frameProps.get('key') !== frameToSkip.get('key') && frameProps.get('audioPlaybackActive') && !frameProps.get('audioMuted')) {
        this.setAudioMuted(frameProps, true)
      } else {
        this.setAudioMuted(frameProps, false)
      }
    })
  },

  /**
   * Dispatches a message to indicate that audio is playing
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {boolean} audioPlaybackActive - true if audio is playing in the frame
   */
  setAudioPlaybackActive: function (frameProps, audioPlaybackActive) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUDIO_PLAYBACK_ACTIVE,
      frameProps,
      audioPlaybackActive
    })
  },

  /**
   * Dispatches a message to indicate that the theme color has changed for a page
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} themeColor - Theme color of the frame
   * @param {string} computedThemeColor - Computed theme color of the
   *   frame which is used if no frame color is present
   */
  setThemeColor: function (frameProps, themeColor, computedThemeColor) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_THEME_COLOR,
      frameProps,
      themeColor,
      computedThemeColor
    })
  },

  /**
   * Dispatches a message to indicate that the favicon has changed
   *
   * @param {Object} frameProps - Properties of the frame in question
   * @param {string} favicon - A url to the favicon to use
   */
  setFavicon: function (frameProps, favicon) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FAVICON,
      frameProps,
      favicon
    })
  },

  /**
   * Dispatches a message to store the last zoom percentage.
   * This is mainly just used to trigger updates throughout React.
   *
   * @param {object} frameProps - The frame to set blocked info on
   * @param {number} percentage - The new zoom percentage
   */
  setLastZoomPercentage: function (frameProps, percentage) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_LAST_ZOOM_PERCENTAGE,
      frameProps,
      percentage
    })
  },

  /**
   * Sets the maximize state of the window
   * @param {boolean} isMaximized - true if window is maximized
   */
  setMaximizeState: function (isMaximized) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_MAXIMIZE_STATE,
      isMaximized
    })
  },

  /**
   * Saves the position of the window in the window state
   * @param {Array} position - [x, y]
   */
  savePosition: function (position) {
    dispatch({
      actionType: windowConstants.WINDOW_SAVE_POSITION,
      position
    })
  },

  /**
   * Saves the size (width, height) of the window in the window state
   * @param {Array} size - [x, y]
   */
  saveSize: function (size) {
    dispatch({
      actionType: windowConstants.WINDOW_SAVE_SIZE,
      size
    })
  },

  /**
   * Sets the fullscreen state of the window
   * @param {boolean} isFullScreen - true if window is fullscreen
   */
  setWindowFullScreen: function (isFullScreen) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FULLSCREEN_STATE,
      isFullScreen
    })
  },

  /**
   * Dispatches a message to indicate if the mouse is in the titlebar
   *
   * @param {boolean} mouseInTitlebar - true if the mouse is in the titlebar
   */
  setMouseInTitlebar: function (mouseInTitlebar) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_MOUSE_IN_TITLEBAR,
      mouseInTitlebar
    })
  },

  /**
   * Dispatches a message to indicate the site info, such as # of blocked ads, should be shown
   *
   * @param {boolean} isVisible - true if the site info should be shown
   */
  setSiteInfoVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_SITE_INFO_VISIBLE,
      isVisible
    })
  },

  /**
   * Dispatches a message to indicate the bravery panel should be shown
   *
   * @param {Object} braveryPanelDetail - Details about how to show the bravery panel.
   *   Set to undefined to hide the panel.  See state documentation for more info.
   */
  setBraveryPanelDetail: function (braveryPanelDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BRAVERY_PANEL_DETAIL,
      braveryPanelDetail
    })
  },

  /**
   * Dispatches a message to indicate if the downloads toolbar is visible
   *
   * @param {boolean} isVisible - true if the site info should be shown
   */
  setDownloadsToolbarVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_DOWNLOADS_TOOLBAR_VISIBLE,
      isVisible
    })
  },

  /**
   * Dispatches a message to indicate the release notes should be visible
   *
   * @param {boolean} isVisible - true if the site info should be shown
   */
  setReleaseNotesVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_RELEASE_NOTES_VISIBLE,
      isVisible
    })
  },

  /**
   * Dispatches a message to indicate the href preview should be shown
   * for a hovered link
   * @param {string} href - the href of the link
   * @param {boolean} showOnRight - display in the right corner
   */
  setLinkHoverPreview: function (href, showOnRight) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_LINK_HOVER_PREVIEW,
      href,
      showOnRight
    })
  },

  /**
   * Dispatches a message to indicate the site info, such as # of blocked ads, should be shown
   *
   * @param {object} frameProps - The frame to set blocked info on
   * @param {string} blockType - type of the block
   * @param {string} location - URL that was blocked
   */
  setBlockedBy: function (frameProps, blockType, location) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BLOCKED_BY,
      frameProps,
      blockType,
      location
    })
  },

  /**
   * Similar to setBlockedBy but for httpse redirects
   * @param {Object} frameProps - The frame to set blocked info on
   * @param {string} ruleset - Name of the HTTPS Everywhere ruleset XML file
   * @param {string} location - URL that was redirected
   */
  setRedirectedBy: function (frameProps, ruleset, location) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_REDIRECTED_BY,
      frameProps,
      ruleset,
      location
    })
  },

  /**
   * Sets which scripts were blocked on a page.
   * @param {Object} frameProps - The frame to set blocked info on
   * @param {string} source - Source of blocked js
   */
  setNoScript: function (frameProps, source) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_NOSCRIPT,
      frameProps,
      source
    })
  },

  /**
   * Sets whether the noscript icon is visible.
   * @param {boolean} isVisible
   */
  setNoScriptVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_NOSCRIPT_VISIBLE,
      isVisible
    })
  },

  /**
   * Adds a history entry
   * @param {Object} frameProps - The frame properties to change history for.
   */
  addHistory: function (frameProps) {
    dispatch({
      actionType: windowConstants.WINDOW_ADD_HISTORY,
      frameProps
    })
  },

  /**
   * Sets whether the clear browsing data popup is visible
   * @param {boolean} isVisible
   */
  setClearBrowsingDataPanelVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_CLEAR_BROWSING_DATA_VISIBLE,
      isVisible
    })
  },

  /**
   * Sets the import browser data popup detail
   * @param {Array} importBrowserDataDetail - list of supported browsers
   */
  setImportBrowserDataDetail: function (importBrowserDataDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_IMPORT_BROWSER_DATA_DETAIL,
      importBrowserDataDetail
    })
  },

  /**
   * Sets the selected import browser data
   * @param {Object} selected - selected browser data to import
   */
  setImportBrowserDataSelected: function (selected) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_IMPORT_BROWSER_DATA_SELECTED,
      selected
    })
  },

  widevineSiteAccessedWithoutInstall: function () {
    dispatch({
      actionType: windowConstants.WINDOW_WIDEVINE_SITE_ACCESSED_WITHOUT_INSTALL
    })
  },

  /**
   * Widevine popup detail changed
   * @param {Object} widevinePanelDetail - detail of the widevine panel
   */
  widevinePanelDetailChanged: function (widevinePanelDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_WIDEVINE_PANEL_DETAIL_CHANGED,
      widevinePanelDetail
    })
  },

  /**
   * Sets the manage autofill address popup detail
   * @param {Object} currentDetail - Properties of the address to change to
   * @param {Object} originalDetail - Properties of the address to edit
   */
  setAutofillAddressDetail: function (currentDetail, originalDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
      currentDetail,
      originalDetail
    })
  },

  /**
   * Sets the manage autofill credit card popup detail
   * @param {Object} currentDetail - Properties of the credit card to change to
   * @param {Object} originalDetail - Properties of the credit card to edit
   */
  setAutofillCreditCardDetail: function (currentDetail, originalDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
      currentDetail,
      originalDetail
    })
  },

  /**
   * Sets source of blocked active mixed content.
   * @param {Object} frameProps - The frame to set source of
   * blocked active mixed content on
   * @param {string} source - Source of blocked active mixed content
   */
  setBlockedRunInsecureContent: function (frameProps, source) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BLOCKED_RUN_INSECURE_CONTENT,
      frameProps,
      source
    })
  },

  /**
   * (Windows only)
   * Dispatches a message to indicate the custom rendered Menubar should be toggled (shown/hidden)
   * @param {boolean} isVisible (optional)
   */
  toggleMenubarVisible: function (isVisible) {
    dispatch({
      actionType: windowConstants.WINDOW_TOGGLE_MENUBAR_VISIBLE,
      isVisible
    })
  },

  /**
   * (Windows only)
   * Used to trigger the click() action for a menu
   * Called from the Menubar control, handled in menu.js
   * @param {string} label - text of the label that was clicked
   */
  clickMenubarSubmenu: function (label) {
    dispatch({
      actionType: windowConstants.WINDOW_CLICK_MENUBAR_SUBMENU,
      label
    })
  },

  /**
   * Used by `main.js` when click happens on content area (not on a link or react control).
   * - closes context menu
   * - closes popup menu
   * - nulls out menubar item selected (Windows only)
   * - hides menubar if auto-hide preference is set (Windows only)
   */
  resetMenuState: function () {
    dispatch({
      actionType: windowConstants.WINDOW_RESET_MENU_STATE
    })
  },

  /**
   * (Windows only)
   * Used to track selected index of a menu bar
   * Needed because arrow keys can be used to navigate the custom menu
   * @param {number} index - zero based index of the item.
   *   Index excludes menu separators and hidden items.
   */
  setMenuBarSelectedIndex: function (index) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_MENUBAR_SELECTED_INDEX,
      index
    })
  },

  /**
   * Used to track selected index of a context menu
   * Needed because arrow keys can be used to navigate the context menu
   * @param {number} index - zero based index of the item.
   *   Index excludes menu separators and hidden items.
   */
  setContextMenuSelectedIndex: function (index) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_CONTEXT_MENU_SELECTED_INDEX,
      index
    })
  },

  /**
   * (Windows only at the moment)
   * Used to track last selected element (typically the URL bar or the frame)
   * Important because focus is lost when using the custom menu and needs
   * to be returned in order for the cut/copy operation to work
   * @param {string} selector - selector used w/ querySelectorAll to return focus
   *   after a menu item is selected (via the custom titlebar / menubar)
   */
  setLastFocusedSelector: function (selector) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_LAST_FOCUSED_SELECTOR,
      selector
    })
  },

  /**
   * Used to get response details (such as the HTTP response code) from a response
   * See `eventStore.js` for an example use-case
   * @param {number} tabId - the tab id to set
   * @param {Object} details - object containing response details
   */
  gotResponseDetails: function (tabId, details) {
    dispatch({
      actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
      tabId,
      details
    })
  },

  /**
   * Fired when the mouse clicks or hovers over a bookmark folder in the bookmarks toolbar
   * @param {number} folderId - from the siteDetail for the bookmark folder
   *   If set to null, no menu is open. If set to -1, mouse is over a bookmark, not a folder
   */
  setBookmarksToolbarSelectedFolderId: function (folderId) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BOOKMARKS_TOOLBAR_SELECTED_FOLDER_ID,
      folderId
    })
  },

  /**
   * Fired when window receives or loses focus
   * @param {boolean} hasFocus - true if focused, false if blurred
   */
  onFocusChanged: function (hasFocus) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_FOCUS_CHANGED,
      hasFocus
    })
  },

  /**
   * Set Modal Dialog detail
   * @param {string} className - name of modal dialog
   * @param {Object} props - properties of the modal dialog
   */
  setModalDialogDetail: function (className, props) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_MODAL_DIALOG_DETAIL,
      className,
      props
    })
  },

  autofillSelectionClicked: function (tabId, value, frontEndId, index) {
    dispatch({
      actionType: windowConstants.WINDOW_AUTOFILL_SELECTION_CLICKED,
      tabId,
      value,
      frontEndId,
      index
    })
  },

  autofillPopupHidden: function (tabId, notify = false) {
    dispatch({
      actionType: windowConstants.WINDOW_AUTOFILL_POPUP_HIDDEN,
      tabId,
      notify
    })
  },

  onTabClosedWithMouse: function (data) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_CLOSED_WITH_MOUSE,
      data
    })
  },

  onTabMouseLeave: function (data) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_MOUSE_LEAVE,
      data
    })
  }
}

module.exports = windowActions
