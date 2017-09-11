/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {dispatch} = require('../dispatcher/appDispatcher')
const windowConstants = require('../constants/windowConstants')

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
   * @param {Object} tabId - Tab id of the frame properties to modify.
   * @param {Object} securityState - The security state properties that have
   *   changed.
   */
  setSecurityState: function (tabId, securityState) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_SECURITY_STATE,
      tabId,
      securityState
    })
  },

  /**
   * Dispatches a message to change the frame tabId
   * @param {Object} frameProps - The frame properties
   * @param {Number} oldTabId - the current tabId
   * @param {Number} newTabId - the new tabId
   */
  frameTabIdChanged: function (frameProps, oldTabId, newTabId) {
    dispatch({
      actionType: windowConstants.WINDOW_FRAME_TAB_ID_CHANGED,
      frameProps,
      oldTabId,
      newTabId
    })
  },

  /**
   * Dispatches a message when the guestInstanceId changes for a frame
   * @param {Object} frameProps - The frame properties
   * @param {Number} oldGuestInstanceId - the current guestInstanceId
   * @param {Number} newGuestInstanceId - the new guestInstanceId
   */
  frameGuestInstanceIdChanged: function (frameProps, oldGuestInstanceId, newGuestInstanceId) {
    dispatch({
      actionType: windowConstants.WINDOW_FRAME_GUEST_INSTANCE_ID_CHANGED,
      frameProps,
      oldGuestInstanceId,
      newGuestInstanceId
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
   * Shows/hides the find-in-page bar.
   * @param {number} frameKey - Key of the frame that we want to modify
   * @param {boolean} shown - Whether to show the find bar
   */
  setFindbarShown: function (frameKey, shown) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FINDBAR_SHOWN,
      frameKey,
      shown
    })
  },

  /**
   * Highlight text in the find bar
   * @param {Object} frameKey - The frame key to modify
   * @param {boolean} selected - Whether to select the find bar search text
   */
  setFindbarSelected: function (frameKey, selected) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FINDBAR_SELECTED,
      frameKey,
      selected
    })
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
   * @param {Object} tabId - Tab id of the frame to put in full screen
   * @param {boolean} isFullScreen - true if the webview is entering full screen mode.
   * @param {boolean} showFullScreenWarning - true if a warning about entering full screen should be shown.
   */
  setFullScreen: function (tabId, isFullScreen, showFullScreenWarning) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FULL_SCREEN,
      tabId,
      isFullScreen,
      showFullScreenWarning
    })
  },

  /**
   * Dispatches a message to close a frame
   *
   * @param {Object} frameKey - Frame key of the frame to close
   */
  closeFrame: function (frameKey) {
    dispatch({
      actionType: windowConstants.WINDOW_CLOSE_FRAME,
      frameKey
    })
  },

  /**
   * Dispatches a message to close multiple frames
   * @param {Object[]} framePropsList - The properties of all frames to close
   */
  closeFrames: function (framePropsList) {
    dispatch({
      actionType: windowConstants.WINDOW_CLOSE_FRAMES,
      framePropsList
    })
  },

  /**
   * Dispatches a message to close multiple frames
   * @param {string} tabId - Frame that we want to ignore when closing all tabs
   * @param {boolean} isCloseRight - Close frames to the right of the frame provided
   * @param {boolean} isCloseLeft - Close frames to the left of the frame provided
   */
  closeOtherFrames: function (tabId, isCloseRight, isCloseLeft) {
    dispatch({
      actionType: windowConstants.WINDOW_CLOSE_OTHER_FRAMES,
      tabId,
      isCloseRight,
      isCloseLeft
    })
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
   * @param {string=} location - only clear frames with this location
   */
  clearClosedFrames: function (location) {
    dispatch({
      actionType: windowConstants.WINDOW_CLEAR_CLOSED_FRAMES,
      location
    })
  },

  /**
   * Dispatches a message to the store when the frame is active and the window is focused
   *
   * @param {Object} location - location for the webview in question.
   * @param {Object} tabId - tabId for the webview in question.
   */
  setFocusedFrame: function (location, tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FOCUSED_FRAME,
      location,
      tabId
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
   * @param {Object} frameKey - the frame key for the webview in question.
   * @param {string} breakpoint - the tab breakpoint to change to
   */
  setTabBreakpoint: function (frameKey, breakpoint) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_BREAKPOINT,
      frameKey,
      breakpoint
    })
  },

  setTabIntersectionState: function (frameKey, ratio) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_CONTENT_INTERSECTION_STATE,
      frameKey,
      ratio
    })
  },

  /**
   * Dispatches a message to the store to set the current tab hover state.
   *
   * @param {Object} frameKey - the frame key for the webview in question.
   * @param {boolean} hoverState - whether or not mouse is over tab
   * @param {boolean} previewMode - whether or not the next tab should be previewed
   * based on mouse idle time
   */
  setTabHoverState: function (frameKey, hoverState, previewMode) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_HOVER_STATE,
      frameKey,
      hoverState,
      previewMode
    })
  },

  /**
   * Dispatches a message to the store to set the current tab hover state.
   *
   * @param {Object} tabPageIndex - the frame key for the webview in question.
   * @param {boolean} hoverState - whether or not mouse is over tabPage
   */
  setTabPageHoverState: function (tabPageIndex, hoverState) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_TAB_PAGE_HOVER_STATE,
      tabPageIndex,
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
   * Dispatches a message to the store to indicate that the specified frame should move locations.
   *
   * @param {Object} sourceFrameKey - the frame key for the webview to move.
   * @param {Object} destinationFrameKey - the frame key for the webview to move to.
   * @param {boolean} prepend - Whether or not to prepend to the destinationFrameProps
   */
  moveTab: function (sourceFrameKey, destinationFrameKey, prepend) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_MOVE,
      sourceFrameKey,
      destinationFrameKey,
      prepend
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
   * Indicates the URLbar has been selected
   */
  urlBarSelected: function (selected) {
    dispatch({
      actionType: windowConstants.WINDOW_URL_BAR_SELECTED
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

  urlBarOnFocus: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_URL_BAR_ON_FOCUS,
      windowId
    })
  },

  urlBarOnBlur: function (windowId, targetValue, locationValue, fromSuggestion) {
    dispatch({
      actionType: windowConstants.WINDOW_URL_BAR_ON_BLUR,
      windowId,
      targetValue,
      locationValue,
      fromSuggestion
    })
  },

  tabOnFocus: function (tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_ON_FOCUS,
      tabId
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
  frameShortcutChanged: function (frameProps, activeShortcut, activeShortcutDetails) {
    dispatch({
      actionType: windowConstants.WINDOW_FRAME_SHORTCUT_CHANGED,
      frameProps,
      activeShortcut,
      activeShortcutDetails
    })
  },

  /**
   * Dispatches a message to set the find-in-page details.
   * @param {Object} frameKey - Frame key of the frame in question
   * @param {Object} findDetail - the find details
   */
  setFindDetail: function (frameKey, findDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_FIND_DETAIL,
      frameKey,
      findDetail
    })
  },

  /**
   * Used for displaying bookmark hanger
   * when adding bookmark site or folder
   */
  addBookmark: function (siteDetail, closestKey) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_ADD_BOOKMARK,
      siteDetail,
      closestKey
    })
  },

  /**
   * Used for displaying bookmark hanger
   * when editing bookmark site or folder
   */
  editBookmark: function (editKey, isHanger) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_EDIT_BOOKMARK,
      editKey,
      isHanger
    })
  },

  /**
   * Used for adding bookmark site directly and then allowing to
   * edit it right afterwords
   * @param isHanger
   * @param bookmarkDetail - bookmark data, if empty active frame will be used
   */
  onBookmarkAdded: function (isHanger, bookmarkDetail) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_BOOKMARK_ADDED,
      bookmarkDetail,
      isHanger
    })
  },

  /**
   * Used for closing a bookmark dialog
   */
  onBookmarkClose: function () {
    dispatch({
      actionType: windowConstants.WINDOW_ON_BOOKMARK_CLOSE
    })
  },

  /**
   * Used for displaying bookmark folder dialog
   * when adding bookmark site or folder
   */
  addBookmarkFolder: function (folderDetails, closestKey) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_ADD_BOOKMARK_FOLDER,
      folderDetails,
      closestKey
    })
  },

  /**
   * Used for displaying bookmark folder dialog
   * when editing bookmark site or folder
   */
  editBookmarkFolder: function (editKey) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_EDIT_BOOKMARK_FOLDER,
      editKey
    })
  },

  /**
   * Used for closing a bookmark dialog
   */
  onBookmarkFolderClose: function () {
    dispatch({
      actionType: windowConstants.WINDOW_ON_BOOKMARK_FOLDER_CLOSE
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
   * @param {number} frameKey - Key of the frame in question
   * @param {number} tabId - Id of the tab in question
   * @param {boolean} muted - true if the frame is muted
   */
  setAudioMuted: function (frameKey, tabId, muted) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUDIO_MUTED,
      frameKey,
      tabId,
      muted
    })
  },

  /**
   * Dispatches a mute/unmute call to all frames in a provided list.
   *
   * @param {Object} frameList - List of frames to consider (frameKey and tabId)
   */
  muteAllAudio: function (frameList) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_ALL_AUDIO_MUTED,
      frameList
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
   * @param {object} tabId - Tab id for the frame to set blocked info on
   * @param {string} blockType - type of the block
   * @param {string} location - URL that was blocked
   */
  setBlockedBy: function (tabId, blockType, location) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_BLOCKED_BY,
      tabId,
      blockType,
      location
    })
  },

  /**
   * Similar to setBlockedBy but for httpse redirects
   * @param {Object} tabId - Tab id of the frame to set blocked info on
   * @param {string} ruleset - Name of the HTTPS Everywhere ruleset XML file
   * @param {string} location - URL that was redirected
   */
  setRedirectedBy: function (tabId, ruleset, location) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_REDIRECTED_BY,
      tabId,
      ruleset,
      location
    })
  },

  /**
   * Sets/toggles whether the noscriptinfo dialog is visible.
   * @param {boolean=} isVisible - if undefined, toggle the current state
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
   * @param {string} property - Property that we want change
   * @param {string} newValue - New value for this property
   * @param {Object} wholeObject - Whole object of address detail
   */
  setAutofillAddressDetail: function (property, newValue, wholeObject) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUTOFILL_ADDRESS_DETAIL,
      property,
      newValue,
      wholeObject
    })
  },

  /**
   * Sets the manage autofill credit card popup detail
   * @param {string} property - Property that we want change
   * @param {string} newValue - New value for this property
   * @param {Object} wholeObject -  Whole object of credit card detail
   */
  setAutofillCreditCardDetail: function (property, newValue, wholeObject) {
    dispatch({
      actionType: windowConstants.WINDOW_SET_AUTOFILL_CREDIT_CARD_DETAIL,
      property,
      newValue,
      wholeObject
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

  onTabMouseMove: function (data) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_MOUSE_MOVE,
      data
    })
  },

  onTabMouseLeave: function (data) {
    dispatch({
      actionType: windowConstants.WINDOW_TAB_MOUSE_LEAVE,
      data
    })
  },

  onFrameMouseEnter: function (tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_FRAME_MOUSE_ENTER,
      tabId
    })
  },

  onFrameMouseLeave: function (tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_FRAME_MOUSE_LEAVE,
      tabId
    })
  },

  // TODO(bridiver) - refactor these as declarative
  shouldSetTitle: function (windowId, title) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_SET_TITLE,
      windowId,
      title
    })
  },

  shouldMinimize: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_MINIMIZE,
      windowId
    })
  },

  shouldMaximize: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_MAXIMIZE,
      windowId
    })
  },

  shouldUnmaximize: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_UNMAXIMIZE,
      windowId
    })
  },

  shouldExitFullScreen: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_EXIT_FULL_SCREEN,
      windowId
    })
  },

  shouldOpenDevTools: function (windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_SHOULD_OPEN_DEV_TOOLS,
      windowId
    })
  },

  onLongBackHistory: function (history, left, top, partition, tabId, windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_GO_BACK_LONG,
      queryInfo: {
        windowId
      },
      history,
      left,
      top,
      partition,
      tabId
    })
  },

  onLongForwardHistory: function (history, left, top, partition, tabId, windowId) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_GO_FORWARD_LONG,
      queryInfo: {
        windowId
      },
      history,
      left,
      top,
      partition,
      tabId
    })
  },

  onCertError: function (tabId, url, error) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_CERT_ERROR,
      tabId,
      url,
      error
    })
  },

  onTabPageContextMenu: function (index) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_TAB_PAGE_CONTEXT_MENU,
      index
    })
  },

  onFrameBookmark: function (tabId) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_FRAME_BOOKMARK,
      tabId
    })
  },

  onStop: function (isFocused, shouldRender) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_STOP,
      isFocused,
      shouldRender
    })
  },

  onMoreBookmarksMenu: function (bookmarks, top) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_MORE_BOOKMARKS_MENU,
      bookmarks,
      top
    })
  },

  onShowBookmarkFolderMenu: function (bookmarkKey, left, top, submenuIndex) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_SHOW_BOOKMARK_FOLDER_MENU,
      bookmarkKey,
      left,
      top,
      submenuIndex
    })
  },

  onSiteDetailMenu: function (bookmarkKey, type) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_SITE_DETAIL_MENU,
      bookmarkKey,
      type
    })
  },

  onWindowUpdate: function (windowId, windowValue) {
    dispatch({
      actionType: windowConstants.WINDOW_ON_WINDOW_UPDATE,
      queryInfo: {
        windowId
      },
      windowValue
    })
  }
}

module.exports = windowActions
