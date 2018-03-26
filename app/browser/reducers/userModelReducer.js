/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// SCL COMMENTS
// Like with UMS, it was written in an aspirational way, not because I had any idea if
// it was correct.
// initialize should initialize the UMS. At present it is missing initialization for searching/shopping/userActivity
// APP_IDLE_STATE_CHANGED
// I was hoping idle would happen after like 2 minutes of browser idleness
// It does occasionally fire, but the period of time is indeterminate and doesn't look reliable
// APP_SHUTTING_DOWN
// should do stuff when browser is shut down
// APP_ADD_AUTOFILL_XXXX
// the idea of this is to find when the user has purchased something, so we don't serve him an
// ad any more. Or, perhaps this is a super great time to serve an ad. Anyway I want to record this, and possibly fire off an ad when this happens
// APP_CHANGE_SETTING

// TODO INCOMPLETES:
// It is important to have something  like "APP_IDLE_STATE_CHANGED" which records when someone has recently restarted doing stuff
// I think there should also be something which counts user interactions with the browser, as in, actively is scrolling, reading searching. For now, tab switches and loading is enough.
// A good time to serve an ad is when the user is about to go back to browsing.
// Possibly it can all be done through TEXT_SCRAPER_DATA_AVAILABLE and something that does what I wish IDLE_STATE_CHANGE did.
// END SCL COMMENTS

'use strict'

// Constants
const appConstants = require('../../../js/constants/appConstants')
const settings = require('../../../js/constants/settings')

// State
const tabState = require('../../common/state/tabState')
const windows = require('../windows')
const userModelState = require('../../common/state/userModelState')

// Utils
const userModel = require('../api/userModel')
const demoApi = require('../api/userModelLog')
const {makeImmutable} = require('../../common/state/immutableUtil')

const userModelReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE: // performed once on app startup
      {
        state = userModel.initialize(state)

        // TODO remove, only for testing
        // setTimeout(() => {
        //   const activeWindowId = windows.getActiveWindowId()
        //   userModel.goAheadAndShowTheAd(activeWindowId, 'My category', 'This is text', 'https://www.google.com')
        // }, 10000)
        break
      }
    case appConstants.APP_TAB_UPDATED: // kind of worthless; fires too often
      {
        state = userModel.tabUpdate(state, action)
        break
      }
    case appConstants.APP_REMOVE_HISTORY_SITE:
      {
        console.log('actionType remove history site')
        state = userModel.removeHistorySite(state, action)
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        state = userModel.removeAllHistory(state)
        break
      }
    case appConstants.APP_TAB_ACTIVATE_REQUESTED:  // tab switching
      {
        const tabId = action.get('tabId')
        const tab = tabState.getByTabId(state, tabId)
        if (tab == null) {
          break
        }

        const url = tab.get('url')
        state = userModel.tabUpdate(state, action)
        state = userModel.testShoppingData(state, url)
        state = userModel.testSearchState(state, url)
        break
      }
    case appConstants.APP_IDLE_STATE_CHANGED: // TODO where to set this globally
      {
        console.log('idle state changed. action: ', action.toJS())

        const activeWindowId = windows.getActiveWindowId()

        if (action.has('idleState') && action.get('idleState') === 'active') {
          state = userModel.recordUnIdle(state)
          state = userModel.basicCheckReadyAdServe(state, activeWindowId)
        }
        break
      }
    case appConstants.APP_TEXT_SCRAPER_DATA_AVAILABLE:
      {
        const tabId = action.get('tabId')
        const tab = tabState.getByTabId(state, tabId)
        if (tab == null) {
          break
        }

        const url = tab.get('url')
        state = userModel.testShoppingData(state, url)
        state = userModel.testSearchState(state, url)
        state = userModel.classifyPage(state, action, tab.get('windowId'))
        break
      }
    case appConstants.APP_SHUTTING_DOWN:
      {
        state = userModel.saveCachedInfo(state)
        break
      }
    case appConstants.APP_ADD_AUTOFILL_ADDRESS:
    case appConstants.APP_ADD_AUTOFILL_CREDIT_CARD:
      {
        // TODO test this SCL
        const url = action.getIn(['details', 'newURL'])
        state = userModelState.flagBuyingSomething(state, url)
        break
      }
    // all other settings go here; TODO need to pipe settings through beyond what is set in appConfig.js
    case appConstants.APP_CHANGE_SETTING:
      {
        switch (action.get('key')) {
          case settings.USERMODEL_ENABLED:
            {
              state = userModel.initialize(state, action.get('value'))
              break
            }
          case settings.ADJUST_FREQ:
            {
              state = userModel.changeAdFreq(state, action.get('value'))
              break
            }
        }
        break
      }
    case appConstants.APP_ON_USERMODEL_LOG:
      {
        demoApi.appendValue(action.get('eventName'), action.get('data'))
        break
      }
  }

  return state
}

module.exports = userModelReducer
