/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const startsWithOption = {
  WINDOWS_TABS_FROM_LAST_TIME: 'lastTime',
  HOMEPAGE: 'homePage',
  NEW_TAB_PAGE: 'newTabPage'
}

const newTabMode = {
  NEW_TAB_PAGE: 'newTabPage',
  HOMEPAGE: 'homePage',
  DEFAULT_SEARCH_ENGINE: 'defaultSearchEngine',
  EMPTY_NEW_TAB: 'emptyNewTab'
}

const bookmarksToolbarMode = {
  TEXT_ONLY: 'textOnly',
  TEXT_AND_FAVICONS: 'textAndFavicons',
  FAVICONS_ONLY: 'faviconsOnly'
}

const tabCloseAction = {
  LAST_ACTIVE: 'lastActive',
  NEXT: 'next',
  PARENT: 'parent'
}

// timing in milliseconds
const tabPreviewTiming = {
  LONG: 2000,
  NORMAL: 1000,
  SHORT: 500
}

const fullscreenOption = {
  ALWAYS_ASK: 'alwaysAsk',
  ALWAYS_ALLOW: 'alwaysAllow'
}

const autoplayOption = {
  ALWAYS_ASK: 'alwaysAsk',
  ALWAYS_ALLOW: 'alwaysAllow'
}

module.exports = {
  startsWithOption,
  newTabMode,
  bookmarksToolbarMode,
  tabCloseAction,
  tabPreviewTiming,
  fullscreenOption,
  autoplayOption
}
