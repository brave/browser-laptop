/* This SourceCode Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {BrowserWindow} = require('electron')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')

// State
const ledgerState = require('../../common/state/ledgerState')
const pageDataState = require('../../common/state/pageDataState')
const migrationState = require('../../common/state/migrationState')

// Utils
const ledgerApi = require('../../browser/api/ledger')
const {makeImmutable} = require('../../common/state/immutableUtil')
const getSetting = require('../../../js/settings').getSetting

const ledgerReducer = (state, action, immutableAction) => {
  let actionType = action.actionType
  if (
    action.actionType !== appConstants.APP_ON_FIRST_LEDGER_SYNC &&
    action.actionType !== appConstants.APP_ON_BRAVERY_PROPERTIES &&
    action.actionType !== appConstants.APP_ON_LEDGER_INIT_READ
  ) {
    action = immutableAction || makeImmutable(action)
    actionType = action.get('actionType')
  }

  switch (actionType) {
    case appConstants.APP_SET_STATE:
      {
        state = ledgerApi.migration(state)
        state = ledgerApi.init(state)
        break
      }
    case appConstants.APP_BACKUP_KEYS:
      {
        ledgerApi.backupKeys(state, action.get('backupAction'))
        break
      }
    case appConstants.APP_RECOVER_WALLET:
      {
        state = ledgerApi.recoverKeys(
          state,
          action.get('useRecoveryKeyFile'),
          action.get('recoveryKey')
        )
        break
      }
    case appConstants.APP_SHUTTING_DOWN:
      {
        state = ledgerApi.quit(state)
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults')
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('browserHistory') && !getSetting(settings.PAYMENTS_ENABLED)) {
          state = ledgerState.resetSynopsis(state)
          ledgerApi.deleteSynopsis()
        }
        break
      }
    case appConstants.APP_CHANGE_SETTING:
      {
        switch (action.get('key')) {
          case settings.PAYMENTS_ENABLED:
            {
              state = ledgerApi.initialize(state, action.get('value'))
              break
            }
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            {
              ledgerApi.setPaymentInfo(action.get('value'))
              break
            }
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            {
              const value = action.get('value')
              if (value <= 0) break
              ledgerApi.saveOptionSynopsis('minPublisherDuration', value)
              state = ledgerState.setSynopsisOption(state, 'minPublisherDuration', value)
              state = ledgerApi.updatePublisherInfo(state)
              break
            }
          case settings.PAYMENTS_MINIMUM_VISITS:
            {
              const value = action.get('value')
              if (value <= 0) break

              ledgerApi.saveOptionSynopsis('minPublisherVisits', value)
              state = ledgerState.setSynopsisOption(state, 'minPublisherVisits', value)
              state = ledgerApi.updatePublisherInfo(state)
              break
            }

          case settings.PAYMENTS_ALLOW_NON_VERIFIED:
            {
              const value = action.get('value')
              ledgerApi.saveOptionSynopsis('showOnlyVerified', value)
              state = ledgerState.setSynopsisOption(state, 'showOnlyVerified', value)
              state = ledgerApi.updatePublisherInfo(state)
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
                ledgerApi.deleteSynopsisPublisher(publisherKey)
                state = ledgerState.deletePublishers(state, publisherKey)
                state = ledgerApi.updatePublisherInfo(state)
              }
              break
            }
          case 'ledgerPayments':
            {
              const publisher = ledgerState.getPublisher(state, publisherKey)
              if (publisher.isEmpty()) {
                break
              }
              state = ledgerApi.updatePublisherInfo(state)
              state = ledgerApi.verifiedP(state, publisherKey)
              break
            }
          case 'ledgerPinPercentage':
            {
              const value = action.get('value')
              const publisher = ledgerState.getPublisher(state, publisherKey)
              if (publisher.isEmpty() || publisher.get('pinPercentage') === value) {
                break
              }
              state = ledgerState.setPublishersProp(state, publisherKey, 'pinPercentage', value)
              state = ledgerApi.updatePublisherInfo(state, publisherKey)
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
          state = ledgerApi.updatePublisherInfo(state)
        }
        break
      }
    case appConstants.APP_NETWORK_CONNECTED:
      {
        ledgerApi.networkConnected(state)
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
    case appConstants.APP_ON_FAVICON_RECEIVED:
      {
        state = ledgerState.setPublishersProp(state, action.get('publisherKey'), 'faviconURL', action.get('blob'))
        state = ledgerApi.updatePublisherInfo(state)
        break
      }
    case appConstants.APP_ON_EXCLUSION_STATUS:
      {
        const key = action.get('publisherKey')
        const value = action.get('excluded')
        ledgerApi.savePublisherOption(key, 'exclude', value)
        state = ledgerState.setPublishersProp(state, key, ['options', 'exclude'], value)
        state = ledgerApi.updatePublisherInfo(state)
        break
      }
    case appConstants.APP_ON_LEDGER_LOCATION_UPDATE:
      {
        const location = action.get('location')
        state = ledgerState.setLocationProp(state, location, action.get('prop'), action.get('value'))
        break
      }
    case appConstants.APP_ON_PUBLISHER_OPTION_UPDATE:
      {
        const value = action.get('value')
        const key = action.get('publisherKey')
        const prop = action.get('prop')
        state = ledgerState.setPublisherOption(state, key, prop, value)
        break
      }
    case appConstants.APP_ON_LEDGER_WALLET_CREATE:
      {
        ledgerApi.boot()
        if (ledgerApi.getNewClient() === null) {
          state = migrationState.setConversionTimestamp(state, new Date().getTime())
          state = migrationState.setTransitionStatus(state, false)
        }
        break
      }
    case appConstants.APP_ON_BOOT_STATE_FILE:
      {
        state = ledgerApi.onBootStateFile(state)
        break
      }
    case appConstants.APP_ON_WALLET_PROPERTIES:
      {
        state = ledgerApi.onWalletProperties(state, action.get('body'))
        break
      }
    case appConstants.APP_LEDGER_PAYMENTS_PRESENT:
      {
        ledgerApi.paymentPresent(state, action.get('tabId'), action.get('present'))
        break
      }
    case appConstants.APP_ON_ADD_FUNDS_CLOSED:
      {
        ledgerApi.addFoundClosed(state)
        break
      }
    case appConstants.APP_ON_CHANGE_ADD_FUNDS_DIALOG_STEP:
      {
        state = ledgerState.saveWizardData(state, action.get('page'), action.get('currency'))
        break
      }
    case appConstants.APP_ON_WALLET_RECOVERY:
      {
        state = ledgerApi.onWalletRecovery(state, action.get('error'), action.get('result'))
        break
      }
    case appConstants.APP_ON_BRAVERY_PROPERTIES:
      {
        state = ledgerApi.onBraveryProperties(state, action.error, action.result)
        break
      }
    case appConstants.APP_ON_FIRST_LEDGER_SYNC:
      {
        state = ledgerApi.onLedgerFirstSync(state, action.parsedData)
        break
      }
    case appConstants.APP_ON_LEDGER_CALLBACK:
      {
        state = ledgerApi.onCallback(state, action.get('result'), action.get('delayTime'))
        break
      }
    case appConstants.APP_ON_TIME_UNTIL_RECONCILE:
      {
        state = ledgerApi.onTimeUntilReconcile(state, action.get('stateResult'))
        break
      }
    case appConstants.APP_ON_LEDGER_RUN:
      {
        ledgerApi.run(state, action.get('delay'))
        break
      }
    case appConstants.APP_ON_NETWORK_CONNECTED:
      {
        state = ledgerApi.onNetworkConnected(state)
        break
      }
    case appConstants.APP_ON_RESET_RECOVERY_STATUS:
      {
        state = ledgerState.setRecoveryStatus(state, null)
        state = ledgerState.setInfoProp(state, 'error', null)
        break
      }
    case appConstants.APP_ON_LEDGER_INIT_READ:
      {
        state = ledgerApi.onInitRead(state, action.parsedData)
        break
      }
    case appConstants.APP_ON_BTC_TO_BAT_NOTIFIED:
      {
        state = migrationState.setNotifiedTimestamp(state, new Date().getTime())
        break
      }
    case appConstants.APP_ON_BTC_TO_BAT_BEGIN_TRANSITION:
      {
        state = migrationState.setTransitionStatus(state, true)
        break
      }
    case appConstants.APP_ON_BTC_TO_BAT_TRANSITIONED:
      {
        state = migrationState.setConversionTimestamp(state, new Date().getTime())
        state = migrationState.setTransitionStatus(state, false)
        break
      }
    case appConstants.APP_ON_LEDGER_QR_GENERATED:
      {
        state = ledgerState.saveQRCode(state, action.get('currency'), action.get('image'))
        break
      }
    case appConstants.APP_IDLE_STATE_CHANGED:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        if (action.has('idleState') && action.get('idleState') !== 'active') {
          state = ledgerApi.pageDataChanged(state)
        }
        break
      }
    case windowConstants.WINDOW_SET_FOCUSED_FRAME:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        if (action.get('location')) {
          state = ledgerApi.pageDataChanged(state, {
            location: action.get('location'),
            tabId: action.get('tabId')
          })
        }
        break
      }
    case appConstants.APP_WINDOW_BLURRED:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        let windowCount = BrowserWindow.getAllWindows().filter((win) => win.isFocused()).length
        if (windowCount === 0) {
          state = ledgerApi.pageDataChanged(state, {}, true)
        }
        break
      }
    case 'event-set-page-info':
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        state = ledgerApi.pageDataChanged(state, {
          location: action.getIn(['pageInfo', 'url'])
        })
        break
      }
    case appConstants.APP_CLOSE_WINDOW:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        state = ledgerApi.pageDataChanged(state)
        break
      }
    case windowConstants.WINDOW_GOT_RESPONSE_DETAILS:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        // Only capture response for the page (not sub resources, like images, JavaScript, etc)
        if (action.getIn(['details', 'resourceType']) === 'mainFrame') {
          const pageUrl = action.getIn(['details', 'newURL'])

          // create a page view event if this is a page load on the active tabId
          const lastActiveTabId = pageDataState.getLastActiveTabId(state)
          const tabId = action.get('tabId')
          if (!lastActiveTabId || tabId === lastActiveTabId) {
            state = ledgerApi.pageDataChanged(state, {
              location: pageUrl,
              tabId
            })
          }
        }
        break
      }
  }
  return state
}

module.exports = ledgerReducer
