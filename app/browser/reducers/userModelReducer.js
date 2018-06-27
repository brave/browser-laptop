/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// Actions
const appActions = require('../../../js/actions/appActions')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const settings = require('../../../js/constants/settings')

// State
const tabState = require('../../common/state/tabState')
const userModelState = require('../../common/state/userModelState')
const windowState = require('../../common/state/windowState')

// Utils
const userModel = require('../api/userModel')
const demoApi = require('../api/userModelLog')
const {makeImmutable} = require('../../common/state/immutableUtil')
const getSetting = require('../../../js/settings').getSetting
const locale = require('../../locale')

const userModelReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_SET_STATE: // performed once on app startup
      {
        if (getSetting(settings.ADS_ENABLED, state.get('settings'))) state = userModel.initialize(state, true)
        break
      }
    case appConstants.APP_WINDOW_UPDATED:
      {
        const winData = windowState.getActiveWindow(state)
        const focusP = winData && winData.get('focused')

        userModel.appFocused(state, focusP)
        state = userModel.generateAdReportingEvent(state, focusP ? 'foreground' : 'background', action)
        break
      }
    case appConstants.APP_TAB_UPDATED: // kind of worthless; fires too often
      {
        const changeInfo = action.get('changeInfo')
        const stat = changeInfo && changeInfo.get('status')
        const complete = stat === 'complete'
        const tabValue = action.get('tabValue')

        if ((tabValue) && (tabValue.get('incongnito') === true)) break

        if (complete) state = userModel.generateAdReportingEvent(state, 'load', action)

        state = userModel.tabUpdate(state, action)
        if (tabValue && !tabValue.get('active')) state = userModel.generateAdReportingEvent(state, 'blur', action)
        break
      }
    case appConstants.APP_REMOVE_HISTORY_SITE:
      {
        const historyKey = action.get('historyKey')

        if (!historyKey) break

        state = userModel.removeHistorySite(state, action)
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        state = userModel.removeAllHistory(state)
        state = userModel.confirmAdUUIDIfAdEnabled(state)
        break
      }
    case appConstants.APP_TAB_ACTIVATE_REQUESTED:  // tab switching
      {
        const tabId = action.get('tabId')
        const tabValue = tabState.getByTabId(state, tabId)

        if ((tabValue == null) || (tabValue.get('incognito') === true)) break

        const url = tabValue.get('url')
        state = userModel.tabUpdate(state, action)
        state = userModel.testShoppingData(state, url)
        state = userModel.testSearchState(state, url)
        state = userModel.generateAdReportingEvent(state, 'focus', action)
        break
      }
    case appConstants.APP_IDLE_STATE_CHANGED: // TODO where to set this globally
      {
        appActions.onUserModelLog('Idle state changed', { idleState: action.get('idleState') })

        if (action.get('idleState') === 'active') {
          state = userModel.recordUnIdle(state)
          appActions.onNativeNotificationAllowedCheck(true)
        }
        break
      }
    case appConstants.APP_TEXT_SCRAPER_DATA_AVAILABLE:
      {
        const tabId = action.get('tabId')
        const tabValue = tabState.getByTabId(state, tabId)

        if ((tabValue == null) || (tabValue.get('incognito') === true)) break

        const url = tabValue.get('url')
        state = userModel.testShoppingData(state, url)
        state = userModel.testSearchState(state, url)
        state = userModel.classifyPage(state, action, tabValue.get('windowId'))
//        state = userModel.debouncedTimingUpdate(state, url)  // correct place for most updates; checks for debounce
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
        const url = action.getIn([ 'details', 'newURL' ])
        state = userModelState.flagBuyingSomething(state, url)
        break
      }
    // all other settings go here; TODO need to pipe settings through beyond what is set in appConfig.js
    case appConstants.APP_CHANGE_SETTING:
      {
        switch (action.get('key')) {
          case settings.ADS_ENABLED:
            {
              const value = action.get('value')
              state = userModel.initialize(state, value)
              if (!value) {
                appActions.createTabRequested({
                  url: 'https://brave.com/ads-user-trials-goodbye'
                })
              }
              break
            }
          case settings.ADS_PLACE:
            {
              state = userModelState.setAdPlace(state, action.get('value'))
              break
            }
          case settings.ADS_LOCALE:
            {
              state = userModel.changeLocale(state, action.get('value'))
              break
            }
        }

        // You need to call this at the bottom of the case and not
        // the top because the `switch` may change the values in question
        state = userModel.generateAdReportingEvent(state, 'settings', action)
        break
      }
    case appConstants.APP_ON_USERMODEL_LOG:
      {
        const eventName = action.get('eventName')
        const data = action.get('data')
        demoApi.appendValue(eventName, data)

        state = userModel.generateAdReportingEvent(state, 'notify', action)
        break
      }
    case appConstants.APP_ON_USERMODEL_COLLECT_ACTIVITY:
      {
        state = userModel.collectActivity(state)
        break
      }
    case appConstants.APP_ON_USERMODEL_UPLOAD_LOGS:
      {
        state = userModel.uploadLogs(state, action.get('stamp'), action.get('retryIn'), action.get('result'))
        break
      }
    case appConstants.APP_ON_USERMODEL_DOWNLOAD_SURVEYS:
      {
        state = userModel.downloadSurveys(state, action.get('entries'))
        break
      }
    case appConstants.APP_NETWORK_CONNECTED:
      {
        userModel.retrieveSSID()
        break
      }
    case appConstants.APP_ON_ADS_SSID_RECEIVED:
      {
        state = userModelState.setSSID(state, action.get('value'))
        break
      }
    case appConstants.APP_ON_USERMODEL_DISABLED:
      {
        state = userModelState.setUserModelValue(state, 'expired', true)
        break
      }
    case appConstants.APP_ON_USERMODEL_EXPIRED:
      {
        appActions.changeSetting(settings.ADS_ENABLED, false)
        appActions.createTabRequested({
          url: 'https://brave.com/ads-user-trials-goodbye'
        })
        appActions.showNotification({
          position: 'global',
          greeting: locale.translation('notificationAdsExpiredThankYou'),
          message: locale.translation('notificationAdsExpiredText'),
          options: {
            style: 'greetingStyle',
            persist: true
          }
        })

        setTimeout(() => {
          appActions.onUserModelDisabled()
        }, 0)
        break
      }
  }

  return state
}

module.exports = userModelReducer
