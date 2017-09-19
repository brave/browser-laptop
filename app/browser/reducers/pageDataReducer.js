/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')

// State
const pageDataState = require('../../common/state/pageDataState')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const {responseHasContent} = require('../../common/lib/httpUtil')

const pageDataReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
      {
        if (action.get('location')) {
          state = pageDataState.addView(state, action.get('location'), action.get('tabId'))
        }
        break
      }
    case appConstants.APP_WINDOW_BLURRED:
      {
        let windowCount = BrowserWindow.getAllWindows().filter((win) => win.isFocused()).length
        if (windowCount === 0) {
          state = pageDataState.addView(state)
        }
        break
      }
    // TODO check if this is used anymore
    case appConstants.APP_IDLE_STATE_CHANGED:
      {
        if (action.has('idleState') && action.get('idleState') !== 'active') {
          state = pageDataState.addView(state)
        }
        break
      }
    case appConstants.APP_WINDOW_CLOSED:
      {
        state = pageDataState.addView(state)
        break
      }
    case 'event-set-page-info':
      {
        // retains all past pages, not really sure that's needed... [MTR]
        state = pageDataState.addInfo(state, action.get('pageInfo'))
        break
      }
    case windowConstants.WINDOW_GOT_RESPONSE_DETAILS:
      {
        // Only capture response for the page (not subresources, like images, JavaScript, etc)
        if (action.getIn(['details', 'resourceType']) === 'mainFrame') {
          const pageUrl = action.getIn(['details', 'newURL'])

          // create a page view event if this is a page load on the active tabId
          const lastActiveTabId = pageDataState.getLastActiveTabId(state)
          const tabId = action.get('tabId')
          if (!lastActiveTabId || tabId === lastActiveTabId) {
            state = pageDataState.addView(state, pageUrl, tabId)
          }

          const responseCode = action.getIn(['details', 'httpResponseCode'])
          if (isSourceAboutUrl(pageUrl) || !responseHasContent(responseCode)) {
            break
          }

          const pageLoadEvent = makeImmutable({
            timestamp: new Date().getTime(),
            url: pageUrl,
            tabId: tabId,
            details: action.get('details')
          })
          state = pageDataState.addLoad(state, pageLoadEvent)
        }
        break
      }
  }

  return state
}

module.exports = pageDataReducer
