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

const tabIdChanged = (oldTabId, newTabId) => {
  // any tabs referencing the old contents Id as the opener,
  // should now reference the new contents Id
  for (const tabId in currentWebContents) {
    const tabData = currentWebContents[tabId]
    if (tabData && tabData.openerTabId != null && tabData.openerTabId === oldTabId) {
      tabData.openerTabId = newTabId
    }
  }
  // we should also give the replacement tab the opener for the old tab
  const newTabData = currentWebContents[newTabId]
  const oldTabData = currentWebContents[oldTabId]
  if (newTabData && oldTabData && oldTabData.openerTabId != null) {
    newTabData.openerTabId = oldTabData.openerTabId
  }
}

module.exports = {
  cleanupWebContents,
  getWebContents,
  getOpenerTabId,
  forgetOpenerForTabId,
  updateWebContents,
  tabIdChanged,
  currentWebContents
}
