/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = null
const appConstants = {
  APP_SET_URL: _,
  APP_SET_NAVBAR_INPUT: _,
  APP_NEW_FRAME: _,
  APP_CLOSE_FRAME: _,
  APP_SET_ACTIVE_FRAME: _,
  APP_SET_TAB_PAGE_INDEX: _,
  APP_TAB_DRAG_START: _,
  APP_TAB_DRAG_STOP: _,
  APP_TAB_DRAGGING_OVER_LEFT: _,
  APP_TAB_DRAGGING_OVER_RIGHT: _,
  APP_TAB_DRAGGING_ON: _,
  APP_TAB_DRAG_EXIT: _,
  APP_TAB_DRAG_EXIT_RIGHT: _,
  APP_TAB_MOVE: _,
  APP_UPDATE_BACK_FORWARD: _,
  APP_WEBVIEW_LOAD_END: _,
  APP_SET_NAVBAR_FOCUSED: _,
  APP_SET_URL_BAR_SUGGESTIONS: _,
  APP_SET_URL_BAR_PREVIEW: _,
  APP_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS: _,
  APP_WEBVIEW_LOAD_START: _,
  APP_SET_FRAME_TITLE: _,
  APP_SET_LOCATION: _, // sets location of a frame
  APP_SET_URL_BAR_ACTIVE: _, // whether the URL bar is being typed in
  APP_UNDO_CLOSED_FRAME: _,
  APP_SET_ACTIVE_FRAME_SHORTCUT: _,
  APP_SET_URL_BAR_AUTOSELECTED: _,
  APP_SET_SEARCH_DETAIL: _
}

// Set each appConstant to an integer value
Object.keys(appConstants).forEach((k, i) => appConstants[k] = i + 1)

module.exports = appConstants
