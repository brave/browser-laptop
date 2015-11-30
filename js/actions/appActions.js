const AppDispatcher = require('../dispatcher/appDispatcher')
const AppConstants = require('../constants/appConstants')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')

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

  setNavBarInput: function (loc) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_NAVBAR_INPUT,
      location: loc
    })
  },

  newFrame: function (frameOpts = {}, openInForeground = true) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_NEW_FRAME,
      frameOpts: frameOpts,
      openInForeground
    })
  },

  setActiveFrame: function (frameProps) {
    AppDispatcher.dispatch({
      actionType: AppConstants.APP_SET_ACTIVE_FRAME,
      frameProps: frameProps
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
  }
}

module.exports = AppActions
