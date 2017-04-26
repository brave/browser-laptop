/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabState = require('../common/state/tabState')
const {shell} = require('electron')

const emailActiveTab = (state, windowId) => {
  const tabValue = tabState.getActiveTabValue(state, windowId)
  shell.openExternal(
    `mailto:?subject=${encodeURIComponent(tabValue.get('title') || '')}&body=${encodeURIComponent(tabValue.get('url'))}`
  )
  return state
}

module.exports = {
  emailActiveTab
}
