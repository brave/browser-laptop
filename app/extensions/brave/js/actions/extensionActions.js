/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var ExtensionActions = {
  /**
   * Dispatches an extension action
   * @param {object} action - The action to dispatch
   */
  dispatchAction: function (action) {
    chrome.ipc.send('dispatch-action', JSON.stringify(action))
  },

  /**
   * sets the publisher for a url
   *
   * @param {string} location - The URL of the page
   * @param {object} publisherInfo - The publisher identification data
   */
  setPageInfo: function (location, pageInfo) {
    pageInfo.url = location
    ExtensionActions.dispatchAction({
      actionType: 'event-set-page-info',
      location,
      pageInfo
    })
  }
}
