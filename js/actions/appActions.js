'use strict'

const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const Config = require('../constants/config')
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')
const AppStore = require('../stores/appStore')
const ipc = require('ipc')

const AppActions = {
  loadUrl: function (loc) {
    if (UrlUtil.isURL(loc)) {
      loc = UrlUtil.getUrlFromInput(loc)
    }
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL,
      location: loc
    })
  },

  setNavBarInput: function (location) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_INPUT,
      location
    })
  },

  setFrameTitle: function (frameProps, title) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_FRAME_TITLE,
      frameProps,
      title
    })
  },

  onWebviewLoadStart: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_WEBVIEW_LOAD_START,
      frameProps
    })
  },

  onWebviewLoadEnd: function (frameProps, location) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_WEBVIEW_LOAD_END,
      frameProps,
      location
    })
  },

  setNavBarFocused: function (focused) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_FOCUSED,
      focused
    })
  },

  newFrame: function (frameOpts = {}, openInForeground = true) {
    frameOpts.location = frameOpts.location || Config.defaultUrl
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

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

  closeWindow: function () {
    ipc.send('close-window')
  },

  quitApplication: function () {
    ipc.send('quit-application')
  },

  setActiveFrame: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_ACTIVE_FRAME,
      frameProps: frameProps
    })
  },

  updateBackForwardState: function (frameProps, canGoBack, canGoForward) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_UPDATE_BACK_FORWARD,
      frameProps,
      canGoBack,
      canGoForward
    })
  },

  tabDragStart: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_START,
      frameProps
    })
  },

  tabDragStop: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_STOP,
      frameProps
    })
  },

  tabDragDraggingOverLeftHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_OVER_LEFT,
      frameProps
    })
  },

  tabDragDraggingOverRightHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_OVER_RIGHT,
      frameProps
    })
  },

  tabDragExit: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_EXIT,
      frameProps
    })
  },

  tabDragExitRightHalf: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAG_EXIT_RIGHT,
      frameProps
    })
  },

  tabDraggingOn: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_DRAGGING_ON,
      frameProps
    })
  },

  moveTab: function (sourceFrameProps, destinationFrameProps, prepend) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_TAB_MOVE,
      sourceFrameProps,
      destinationFrameProps,
      prepend
    })
  },

  setUrlBarSuggestions: function (suggestionList, selectedIndex) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_SUGGESTIONS,
      suggestionList,
      selectedIndex
    })
  },

  setUrlBarPreview: function (value) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_PREVIEW,
      value
    })
  },

  setUrlBarSuggestionSearchResults: function (searchResults) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS,
      searchResults
    })
  }
}

module.exports = AppActions
