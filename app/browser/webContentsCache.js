/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const appActions = require('../../js/actions/appActions')

const currentWebContents = {}

const cleanupWebContents = (tabId) => {
  if (currentWebContents[tabId]) {
    delete currentWebContents[tabId]
    appActions.tabClosed({ tabId })
  }
}

const getWebContents = (tabId) => {
  return currentWebContents[tabId]
}

const updateWebContents = (tabId, tab) => {
  currentWebContents[tabId] = tab
}

module.exports = {
  cleanupWebContents,
  getWebContents,
  updateWebContents,
  currentWebContents
}
