/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const WindowDispatcher = require('../dispatcher/windowDispatcher')
const WindowConstants = require('../constants/windowConstants')
const config = require('../constants/config')
const UrlUtil = require('../lib/urlutil')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const messages = require('../constants/messages')
const appActions = require('./appActions')
const getSourceAboutUrl = require('../lib/appUrlUtil').getSourceAboutUrl

function dispatch (action) {
  if (windowActions.dispatchToIPC) {
    // serialize immutable
    if (action.frameProps && action.frameProps.toJS) {
      action.frameProps = action.frameProps.toJS()
    }
    remote.getCurrentWindow().webContents.send('handle-action', action)
    windowActions.dispatchToIPC = false
  } else {
    WindowDispatcher.dispatch(action)
  }
}

const windowActions = {
  dispatchViaIPC: function () {
    this.dispatchToIPC = true
  },

  /**
   * Dispatches an event to the main process to replace the window state
   *
   * @param {object} windowState - Initial window state object
   */
  setState: function (windowState) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_STATE,
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
        frame.get('location') !== 'about:certerror') {
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
      windowActions.newFrame({
        location
      }, true)
      return
    } else {
      dispatch({
        actionType: WindowConstants.WINDOW_SET_URL,
        location,
        key: frame.get('key')
      })
    }
  },

  /**
   * Dispatches a message to the store to set the current navigated location.
   * This differs from the above in that it will not change the webview's (iframe's) src.
   * This should be used for renderer initiated navigation but not user initiated loads.
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
    dispatch({
      actionType: WindowConstants.WINDOW_SET_LOCATION,
      location,
      key: key
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
      actionType: WindowConstants.WINDOW_SET_SECURITY_STATE,
      securityState,
      frameProps
    })
  },

  /**
   * Dispatches a message to set the login required detail.
   * @param {Object} frameProps - The frame where the login required prompt should be shown.
   * @param {Object} detail - Details of the login required operation.
   */
  setLoginRequiredDetail: function (frameProps, detail) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_LOGIN_REQUIRED_DETAIL,
      frameProps,
      detail
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
    dispatch({
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
    dispatch({
      actionType: WindowConstants.WINDOW_SET_FINDBAR_SHOWN,
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
      actionType: WindowConstants.WINDOW_SET_FINDBAR_SELECTED,
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
    dispatch({
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
    dispatch({
      actionType: WindowConstants.WINDOW_WEBVIEW_LOAD_END,
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
    if (isFullScreen === false) {
      // Make sure the associated webview is in sync with what we're doing
      const webview = document.querySelector(`webview[data-frame-key="${frameProps.get('key')}"]`)
      if (webview) {
        webview.executeJavaScript('document.webkitExitFullscreen()')
      }
    }
    dispatch({
      actionType: WindowConstants.WINDOW_SET_FULL_SCREEN,
      frameProps,
      isFullScreen,
      showFullScreenWarning
    })
  },

  /**
   * Dispatches a message to the store to indicate if the navigation bar is focused.
   *
   * @param {boolean} focused - true if the navigation bar should be considered as focused
   */
  setNavBarFocused: function (focused) {
    dispatch({
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
  newFrame: function (frameOpts, openInForeground) {
    if (frameOpts === undefined) {
      frameOpts = {}
    }
    if (openInForeground === undefined) {
      openInForeground = true
    }
    frameOpts.location = frameOpts.location || config.defaultUrl
    if (frameOpts.location && UrlUtil.isURL(frameOpts.location)) {
      frameOpts.location = UrlUtil.getUrlFromInput(frameOpts.location)
    }
    dispatch({
      actionType: WindowConstants.WINDOW_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

  /**
   * Dispatches a message to the store to create a new frame similar to the passed arg.
   *
   * @param {Object} frameProps - The properties of the frame to clone
   */
  cloneFrame: function (frameProps) {
    this.newFrame({
      location: frameProps.get('location'),
      isPrivate: frameProps.get('isPrivate'),
      partitionNumber: frameProps.get('partitionNumber')
    }, false)
  },

  /**
   * Dispatches a message to close a frame
   *
   * @param {Object[]} frames - Immutable list of of all the frames
   * @param {Object} frameProps - The properties of the frame to close
   */
  closeFrame: function (frames, frameProps, forceClosePinned) {
    // If the frame was full screen, exit
    if (frameProps && frameProps.get('isFullScreen')) {
      this.setFullScreen(frameProps, false)
    }
    // Flush out any pending login required prompts
    if (frameProps && frameProps.getIn(['security', 'loginRequiredDetail'])) {
      ipc.send(messages.LOGIN_RESPONSE, frameProps.get('location'))
    }
    // Unless a caller explicitly specifies to close a pinned frame, then
    // ignore the call.
    const nonPinnedFrames = frames.filter(frame => !frame.get('pinnedLocation'))
    if (frameProps && frameProps.get('pinnedLocation')) {
      // Check for no frames at all, and if that's the case the user
      // only has pinned frames and tried to close, so close the
      // whole app.
      if (nonPinnedFrames.size === 0) {
        appActions.closeWindow(remote.getCurrentWindow().id)
        return
      }

      if (!forceClosePinned) {
        // Go to next frame if the user tries to close a pinned tab
        ipc.emit(messages.SHORTCUT_NEXT_TAB)
        return
      }
    }

    const pinnedFrames = frames.filter(frame => frame.get('pinnedLocation'))

    // If there is at least 1 pinned frame don't close the window until subsequent
    // close attempts
    if (nonPinnedFrames.size > 1 || pinnedFrames.size > 0) {
      dispatch({
        actionType: WindowConstants.WINDOW_CLOSE_FRAME,
        frameProps
      })
    } else {
      appActions.closeWindow(remote.getCurrentWindow().id)
    }
  },

  /**
   * Dispatches a message to the store to undo a closed frame
   * The new frame is expected to appear at the index it was last closed at
   */
  undoClosedFrame: function () {
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: WindowConstants.WINDOW_UPDATE_BACK_FORWARD,
      frameProps,
      canGoBack,
      canGoForward
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
      actionType: WindowConstants.WINDOW_SET_IS_BEING_DRAGGED_OVER_DETAIL,
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
    dispatch({
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
    dispatch({
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
    dispatch({
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
    dispatch({
      actionType: WindowConstants.WINDOW_SET_URL_BAR_SELECTED,
      selected,
      forSearchMode
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
      actionType: WindowConstants.WINDOW_SET_URL_BAR_ACTIVE,
      isActive
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
      actionType: WindowConstants.WINDOW_SET_ACTIVE_FRAME_SHORTCUT,
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
    dispatch({
      actionType: WindowConstants.WINDOW_SET_FIND_DETAIL,
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
   */
  setBookmarkDetail: function (currentDetail, originalDetail, destinationDetail) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_BOOKMARK_DETAIL,
      currentDetail,
      originalDetail,
      destinationDetail
    })
  },

  /**
   * Dispatches a message to set context menu detail.
   * If set, also indicates that the context menu is shown.
   * @param {Object} detail - The context menu detail
   */
  setContextMenuDetail: function (detail) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_CONTEXT_MENU_DETAIL,
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
    dispatch({
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
   * @param {string} computedThemeColor - Computed theme color of the
   *   frame which is used if no frame color is present
   */
  setThemeColor: function (frameProps, themeColor, computedThemeColor) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_THEME_COLOR,
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
    dispatch({
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
   * @param {boolean} expandHttpse - If specified, indicates if the httpse section should be expanded
   */
  setSiteInfoVisible: function (isVisible, expandTrackingProtection, expandAdblock, expandHttpse) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_SITE_INFO_VISIBLE,
      isVisible,
      expandTrackingProtection,
      expandAdblock,
      expandHttpse
    })
  },

  /**
   * Dispatches a message to indicate the release notes should be visible
   *
   * @param {boolean} isVisible - true if the site info should be shown
   */
  setReleaseNotesVisible: function (isVisible) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_RELEASE_NOTES_VISIBLE,
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
      actionType: WindowConstants.WINDOW_SET_LINK_HOVER_PREVIEW,
      href,
      showOnRight
    })
  },

  /**
   * Dispatches a message to indicate the site info, such as # of blocked ads, should be shown
   *
   * @param {object} frameProps - The frame to set blocked info on
   * @param {string} blockType - either 'adblock' or 'trackingProtection'
   * @param {string} location - URL that was blocked
   */
  setBlockedBy: function (frameProps, blockType, location) {
    dispatch({
      actionType: WindowConstants.WINDOW_SET_BLOCKED_BY,
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
      actionType: WindowConstants.WINDOW_SET_REDIRECTED_BY,
      frameProps,
      ruleset,
      location
    })
  },

  zoomIn: function (frameProps) {
    dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_IN
    })
  },

  zoomOut: function (frameProps) {
    dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_OUT
    })
  },

  zoomReset: function (frameProps) {
    dispatch({
      frameProps,
      actionType: WindowConstants.WINDOW_ZOOM_RESET
    })
  },

  inspectElement: function (x, y) {
    const webview = document.querySelector('webview')
    if (webview) {
      webview.inspectElement(x, y)
    }
  }
}

module.exports = windowActions
