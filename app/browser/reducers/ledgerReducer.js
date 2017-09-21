/* This SourceCode Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const underscore = require('underscore')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')

// State
const ledgerState = require('../../common/state/ledgerState')

// Utils
const ledgerUtil = require('../../common/lib/ledgerUtil')
const {makeImmutable} = require('../../common/state/immutableUtil')
const getSetting = require('../../../js/settings').getSetting

const ledgerReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_UPDATE_LEDGER_INFO:
      {
        state = state.setIn(['ledger', 'info'], action.get('ledgerInfo'))
        break
      }
    // TODO refactor
    case appConstants.APP_UPDATE_LOCATION_INFO:
      {
        state = state.setIn(['ledger', 'locations'], action.get('locationInfo'))
        break
      }
    case appConstants.APP_LEDGER_RECOVERY_STATUS_CHANGED:
      {
        state = ledgerState.setRecoveryStatus(state, action.get('recoverySucceeded'))
        break
      }
    case appConstants.APP_SET_STATE:
      {
        state = ledgerUtil.init(state)
        break
      }
    case appConstants.APP_BACKUP_KEYS:
      {
        ledgerUtil.backupKeys(state, action.get('backupAction'))
        break
      }
    case appConstants.APP_RECOVER_WALLET:
      {
        state = ledgerUtil.recoverKeys(
          state,
          action.get('useRecoveryKeyFile'),
          action.get('firstRecoveryKey'),
          action.get('secondRecoveryKey')
        )
        break
      }
    case appConstants.APP_SHUTTING_DOWN:
      {
        state = ledgerUtil.quit(state)
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults')
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('browserHistory') && !getSetting(settings.PAYMENTS_ENABLED)) {
          state = ledgerState.resetSynopsis(state)
        }
        break
      }
    // TODO not sure that we use APP_IDLE_STATE_CHANGED anymore
    case appConstants.APP_IDLE_STATE_CHANGED:
      {
        state = ledgerUtil.pageDataChanged(state)
        ledgerUtil.addVisit('NOOP', underscore.now(), null)
        break
      }
    case appConstants.APP_CHANGE_SETTING:
      {
        switch (action.get('key')) {
          case settings.PAYMENTS_ENABLED:
            {
              state = ledgerUtil.initialize(state, action.get('value'))
              break
            }
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            {
              ledgerUtil.setPaymentInfo(action.get('value'))
              break
            }
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            {
              const value = action.get('value')
              if (value <= 0) break
              ledgerUtil.synopsis.options.minPublisherDuration = action.value
              state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', value)
              break
            }
          case settings.PAYMENTS_MINIMUM_VISITS:
            {
              const value = action.get('value')
              if (value <= 0) break

              ledgerUtil.synopsis.options.minPublisherVisits = value
              state = ledgerState.setSynopsisOption(state, 'minPublisherVisits', value)
              break
            }

          case settings.PAYMENTS_ALLOW_NON_VERIFIED:
            {
              const value = action.get('value')
              ledgerUtil.synopsis.options.showOnlyVerified = value
              state = ledgerState.setSynopsisOption(state, 'showOnlyVerified', value)
              break
            }
        }
        break
      }
    case appConstants.APP_CHANGE_SITE_SETTING:
      {
        const pattern = action.get('hostPattern')
        if (!pattern) {
          console.warn('Changing site settings should always have a hostPattern')
          break
        }
        const i = pattern.indexOf('://')
        if (i === -1) break

        const publisherKey = pattern.substr(i + 3)
        switch (action.get('key')) {
          case 'ledgerPaymentsShown':
            {
              if (action.get('value') === false) {
                delete ledgerUtil.synopsis.publishers[publisherKey]
                state = ledgerState.deletePublishers(state, publisherKey)
                state = ledgerUtil.updatePublisherInfo(state)
              }
              break
            }
          case 'ledgerPayments':
            {
              const publisher = ledgerState.getPublisher(state, publisherKey)
              if (publisher.isEmpty()) {
                break
              }
              state = ledgerUtil.updatePublisherInfo(state)
              state = ledgerUtil.verifiedP(state, publisherKey)
              break
            }
          case 'ledgerPinPercentage':
            {
              const publisher = ledgerState.getPublisher(state, publisherKey)
              if (publisher.isEmpty()) {
                break
              }

              ledgerUtil.synopsis.publishers[publisherKey].pinPercentage = action.get('value')
              state = ledgerUtil.updatePublisherInfo(state, publisherKey)
              break
            }
        }
        break
      }
    case appConstants.APP_REMOVE_SITE_SETTING:
      {
        const pattern = action.get('hostPattern')
        if (!pattern) {
          console.warn('Changing site settings should always have a hostPattern')
          break
        }

        const i = pattern.indexOf('://')
        if (i === -1) break

        const publisherKey = pattern.substr(i + 3)
        if (action.get('key') === 'ledgerPayments') {
          const publisher = ledgerState.getPublisher(state, publisherKey)
          if (publisher.isEmpty()) {
            break
          }
          state = ledgerUtil.updatePublisherInfo(state)
        }
        break
      }
    case appConstants.APP_NETWORK_CONNECTED:
      {
        setTimeout((state) => {
          ledgerUtil.networkConnected(state)
        }, 1000, state)
        break
      }
    case appConstants.APP_NAVIGATOR_HANDLER_REGISTERED:
      {
        const hasBitcoinHandler = (action.get('protocol') === 'bitcoin')
        state = ledgerState.setInfoProp(state, 'hasBitcoinHandler', hasBitcoinHandler)
        break
      }
    case appConstants.APP_NAVIGATOR_HANDLER_UNREGISTERED:
      {
        const hasBitcoinHandler = false
        state = ledgerState.setInfoProp(state, 'hasBitcoinHandler', hasBitcoinHandler)
        break
      }
    case 'event-set-page-info':
    case appConstants.APP_WINDOW_BLURRED:
    case appConstants.APP_CLOSE_WINDOW:
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
    case windowConstants.WINDOW_GOT_RESPONSE_DETAILS:
      {
        state = ledgerUtil.pageDataChanged(state)
        break
      }
  }
  return state
}

module.exports = ledgerReducer
