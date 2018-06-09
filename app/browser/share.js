/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const tabState = require('../common/state/tabState')
const {shell} = require('electron')
const tabs = require('./tabs')

const templateUrls = {
  email: 'mailto:?subject={title}&body={url}', // Do not edit without security review
  facebook: 'https://www.facebook.com/sharer.php?u={url}',
  pinterest: 'https://pinterest.com/pin/create/bookmarklet/?url={url}&description={title}',
  twitter: 'https://twitter.com/intent/tweet?url={url}&text={title}&hashtags=odin',
  googlePlus: 'https://plus.google.com/share?url={url}',
  linkedIn: 'https://www.linkedin.com/shareArticle?url={url}&title={title}',
  buffer: 'https://buffer.com/add?text={title}&url={url}',
  reddit: 'https://reddit.com/submit?url={url}&title={title}'
}

const validateShareType = (shareType) =>
  assert(templateUrls[shareType], 'The specified shareType is not recognized')

/**
 * Performs a simple share operation for the active tab in the specified window.
 *
 * @param {number} windowId - The window for the active tab to use
 * @param {string} shareType - The template to use, see the property key names in templateUrls above.
 */
const simpleShareActiveTab = (state, windowId, shareType) => {
  const tabValue = tabState.getActiveTab(state, windowId)
  const encodedTitle = encodeURIComponent(tabValue.get('title') || '')
  const encodedUrl = encodeURIComponent(tabValue.get('url'))

  validateShareType(shareType)
  const templateUrl = templateUrls[shareType]

  const url = templateUrl
    .replace('{url}', encodedUrl)
    .replace('{title}', encodedTitle)

  if (shareType === 'email') {
    shell.openExternal(url)
  } else {
    tabs.create({
      url
    })
  }
  return state
}

module.exports = {
  simpleShareActiveTab,
  templateUrls
}
