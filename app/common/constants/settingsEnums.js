/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const startsWithOption = {
  WINDOWS_TABS_FROM_LAST_TIME: 'lastTime',
  HOMEPAGE: 'homePage',
  NEW_TAB_PAGE: 'newTabPage'
}

const newTabMode = {
  BLANK: 'blank',
  NEW_TAB_PAGE: 'newTabPage',
  HOMEPAGE: 'homePage',
  DEFAULT_SEARCH_ENGINE: 'defaultSearchEngine'
}

const bookmarksToolbarMode = {
  TEXT_ONLY: 'textOnly',
  TEXT_AND_FAVICONS: 'textAndFavicons',
  FAVICONS_ONLY: 'faviconsOnly'
}

module.exports = {
  startsWithOption,
  newTabMode,
  bookmarksToolbarMode
}
