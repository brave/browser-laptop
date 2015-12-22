/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const mapValuesByKeys = require('../lib/functional').mapValuesByKeys

const _ = null
const windowConstants = {
  WINDOW_SET_URL: _,
  WINDOW_SET_NAVBAR_INPUT: _,
  WINDOW_NEW_FRAME: _,
  WINDOW_CLOSE_FRAME: _,
  WINDOW_SET_ACTIVE_FRAME: _,
  WINDOW_SET_TAB_PAGE_INDEX: _,
  WINDOW_TAB_DRAG_START: _,
  WINDOW_TAB_DRAG_STOP: _,
  WINDOW_TAB_DRAGGING_OVER_LEFT: _,
  WINDOW_TAB_DRAGGING_OVER_RIGHT: _,
  WINDOW_TAB_DRAGGING_ON: _,
  WINDOW_TAB_DRAG_EXIT: _,
  WINDOW_TAB_DRAG_EXIT_RIGHT: _,
  WINDOW_TAB_MOVE: _,
  WINDOW_SET_THEME_COLOR: _,
  WINDOW_UPDATE_BACK_FORWARD: _,
  WINDOW_WEBVIEW_LOAD_END: _,
  WINDOW_SET_NAVBAR_FOCUSED: _,
  WINDOW_SET_URL_BAR_SUGGESTIONS: _,
  WINDOW_SET_URL_BAR_PREVIEW: _,
  WINDOW_SET_URL_BAR_SUGGESTION_SEARCH_RESULTS: _,
  WINDOW_WEBVIEW_LOAD_START: _,
  WINDOW_SET_FRAME_TITLE: _,
  WINDOW_SET_LOCATION: _, // sets location of a frame
  WINDOW_SET_URL_BAR_ACTIVE: _, // whether the URL bar is being typed in
  WINDOW_UNDO_CLOSED_FRAME: _,
  WINDOW_SET_ACTIVE_FRAME_SHORTCUT: _,
  WINDOW_SET_URL_BAR_AUTOSELECTED: _,
  WINDOW_SET_SEARCH_DETAIL: _,
  WINDOW_SET_AUDIO_MUTED: _,
  WINDOW_SET_AUDIO_PLAYBACK_ACTIVE: _
}

module.exports = mapValuesByKeys(windowConstants)
