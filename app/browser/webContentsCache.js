/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const currentWebContents = {}

const cleanupWebContents = (tabId) => {
  if (currentWebContents[tabId]) {
    delete currentWebContents[tabId]
  }
}

const getWebContents = (tabId) => {
  const tabData = currentWebContents[tabId]
  return tabData ? tabData.tab : null
}

const getOpenerTabId = (tabId) => {
  const tabData = currentWebContents[tabId]
  return tabData ? tabData.openerTabId : null
}

const updateWebContents = (tabId, tab, openerTabId) => {
  currentWebContents[tabId] = { tab, openerTabId }
}

const forgetOpenerForTabId = (tabId) => {
  const tabData = currentWebContents[tabId]
  if (tabData) {
    tabData.openerTabId = null
  }
}

module.exports = {
  cleanupWebContents,
  getWebContents,
  getOpenerTabId,
  forgetOpenerForTabId,
  updateWebContents,
  currentWebContents
}
