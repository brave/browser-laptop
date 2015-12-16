/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const Config = require('../constants/config')
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')
const AppStore = require('../stores/appStore')
const ipc = global.require('electron').ipcRenderer

const AppActions = {
  /**
   * Dispatches a message to the store to load a new URL for the active frame.
   * Both the frame's src and location properties will be updated accordingly.
   *
   * In general, an iframe's src should not be updated when navigating within the frame to a new page,
   * but the location should. For user entered new URLs, both should be updated.
   *
   * @param location The URL of the page to load
   */
  loadUrl: function (location) {
    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current navigated location.
   * This differs from the above in that it will not change the webview's (iframe's) src.
   * This should be used for inter-page navigation but not user initiated loads.
   *
   * @param location The URL of the page to load
   * @param key The frame key to modify, it is checked against the active frame and if
   * it is active the URL text will also be changed.
   */
  setLocation: function (location, key) {
    if (UrlUtil.isURL(location)) {
      location = UrlUtil.getUrlFromInput(location)
    }
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_LOCATION,
      location,
      key: key
    })
  },

  /**
   * Dispatches a message to the store to set the user entered text for the URL bar.
   * Unlike setLocation and loadUrl, this does not modify the state of src and location.
   *
   * @param location The text to set as the new navbar URL input
   */
  setNavBarUserInput: function (location) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_INPUT,
      location
    })
  },

  /**
   * Dispatches a message to the store to set the current frame's title.
   * This should be called in response to the webview encountering a <title> tag.
   *
   * @param frameProps The frame properties to modify
   * @param title The title to set for the frame
   */
  setFrameTitle: function (frameProps, title) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_FRAME_TITLE,
      frameProps,
      title
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is loading.
   *
   * @param frameProps The frame properties for the webview in question.
   */
  onWebviewLoadStart: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_WEBVIEW_LOAD_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the webview is done loading.
   *
   * @param frameProps The frame properties for the webview in question.
   */
  onWebviewLoadEnd: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_WEBVIEW_LOAD_END,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate if the navigation bar is focused.
   *
   * @param focused true if the navigation bar should be considered as focused
   */
  setNavBarFocused: function (focused) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_FOCUSED,
      focused
    })
  },

  /**
   * Dispatches a message to the store to create a new frame
   *
   * @param frameOpts An object of frame options such as isPrivate, element, and tab features.
   *                  These may not all be hooked up in Electron yet.
   * @param openInForeground true if the new frame should become the new active frame
   */
  newFrame: function (frameOpts = {}, openInForeground = true) {
    frameOpts.location = frameOpts.location || Config.defaultUrl
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

  /**
   * Dispatches an event to the main process to create a new window
   */
  newWindow: function () {
    ipc.send('new-window')
  },

  closeFrame: function (frameProps) {
    if (AppStore.getFrameCount() > 1) {
      AppDispatcher.dispatch({
        actionType: AppConstants.APP_CLOSE_FRAME,
        frameProps
      })
    } else {
      this.closeWindow()
    }
  },

  /**
   * Dispatches an event to the main process to close the current window
   */
  closeWindow: function () {
    ipc.send('close-window')
  },

  /**
   * Dispatches a message to the store to undo a closed frame
   * The new frame is expected to appear at the index it was last closed at
   */
  undoClosedFrame: function () {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_UNDO_CLOSED_FRAME
    })
  },

  /**
   * Dispatches an event to the main process to quit the entire application
   */
  quitApplication: function () {
    ipc.send('quit-application')
  },

  /**
   * Dispatches a message to the store to set a new frame as the active frame.
   *
   * @param frameProps the frame properties for the webview in question.
   */
  setActiveFrame: function (frameProps) {
    if (!frameProps) {
      return
    }
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_ACTIVE_FRAME,
      frameProps: frameProps
    })
  },

  /**
   * Dispatches a message to the store to set the tab page index.
   *
   * @param index the tab page index to change to
   */
  setTabPageIndex: function (index) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_TAB_PAGE_INDEX,
      index
    })
  },

  /**
   * Dispatches a message to the store to update the back-forward information.
   *
   * @param frameProps the frame properties for the webview in question.
   * @param canGoBack Specifies if the active frame has previous entries in its history
   * @param canGoForward Specifies if the active frame has next entries in its history (i.e. the user pressed back at least once)
   */
  updateBackForwardState: function (frameProps, canGoBack, canGoForward) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_UPDATE_BACK_FORWARD,
      frameProps,
      canGoBack,
      canGoForward
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has started for that frame.
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragStart: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_START,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has stopped for that frame.
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragStop: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_STOP,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the left half of this tab.
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragDraggingOverLeftHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_OVER_LEFT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that something is dragging over the right half of this tab.
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragDraggingOverRightHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_OVER_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the frame
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragExit: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_EXIT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging has exited the right half of the frame
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDragExitRightHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_EXIT_RIGHT,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that tab dragging started on the tab
   *
   * @param frameProps the frame properties for the webview in question.
   */
  tabDraggingOn: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_ON,
      frameProps
    })
  },

  /**
   * Dispatches a message to the store to indicate that the specified frame should move locations.
   *
   * @param sourceFrameProps the frame properties for the webview to move.
   * @param destinationFrameProps the frame properties for the webview to move to.
   * @param prepend Whether or not to prepend to the destinationFrameProps
   */
  moveTab: function (sourceFrameProps, destinationFrameProps, prepend) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_MOVE,
      sourceFrameProps,
      destinationFrameProps,
      prepend
    })
  },

  /*
   * Sets the URL bar suggestions and selected index.
   *
   * @param suggestionList The list of suggestions for the entered URL bar text. This can be generated from history, bookmarks, etc.
   * @param selectedIndex The index for the selected item (users can select items with down arrow on their keyboard)
   */
  setUrlBarSuggestions: function (suggestionList, selectedIndex) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_SUGGESTIONS,
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
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_PREVIEW,
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
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS,
      searchResults
    })
  },

  /**
   * Marks the URL bar text as selected or not
   *
   * @param isSelected Whether or not the URL bar should be autoselected
   */
  setUrlBarAutoselected: function (isAutoselected) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_AUTOSELECTED,
      isAutoselected
    })
  },

  /**
   * Marks the URL bar as active or not
   *
   * @param isActive Whether or not the URL bar should be marked as active
   */
  setUrlBarActive: function (isActive) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_ACTIVE,
      isActive
    })
  },

  /**
   * Dispatches a message to the store to indicate that the pending frame shortcut info should be updated.
   *
   * @param activeShortcut The text for the new shortcut. Usually this is null to clear info which was previously
   * set from an IPC call.
   */
  setActiveFrameShortcut: function (activeShortcut) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_ACTIVE_FRAME_SHORTCUT,
      activeShortcut
    })
  },

  /**
   * Dispatches a message to set the search engine details.
   * @param searchDetail the search details
   */
  setSearchDetail: function (searchDetail) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_SEARCH_DETAIL,
      searchDetail
    })
  }
}

module.exports = AppActions
