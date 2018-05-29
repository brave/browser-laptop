/* This SourceCode Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const {BrowserWindow} = require('electron')
const {getWebContents} = require('../webContentsCache')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const windowConstants = require('../../../js/constants/windowConstants')
const settings = require('../../../js/constants/settings')
const tabActionConstants = require('../../common/constants/tabAction')
const ledgerStatuses = require('../../common/constants/ledgerStatuses')
const messages = require('../../../js/constants/messages')

// State
const ledgerState = require('../../common/state/ledgerState')
const pageDataState = require('../../common/state/pageDataState')
const updateState = require('../../common/state/updateState')
const aboutPreferencesState = require('../../common/state/aboutPreferencesState')
const tabState = require('../../common/state/tabState')

// Utils
const windows = require('../windows')
const ledgerApi = require('../../browser/api/ledger')
const ledgerNotifications = require('../../browser/api/ledgerNotifications')
const {makeImmutable, makeJS} = require('../../common/state/immutableUtil')
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
        state = ledgerApi.referralCheck(state)
        break
      }
    case appConstants.APP_BACKUP_KEYS:
      {
        state = ledgerApi.backupKeys(state, action.get('backupAction'))
        break
      }
    case appConstants.APP_RECOVER_WALLET:
      {
        const recoveryKey = action.get('recoveryKey')
        const useRecoveryKeyFile = action.get('useRecoveryKeyFile')

        if (!useRecoveryKeyFile) {
          state = aboutPreferencesState.setRecoveryInProgress(state, true)
        }

        state = ledgerApi.recoverKeys(state, useRecoveryKeyFile, recoveryKey)
        break
      }
    case appConstants.APP_ON_FILE_RECOVERY_KEYS:
      {
        state = ledgerApi.fileRecoveryKeys(state, action.get('file'))
        break
      }
    case appConstants.APP_SHUTTING_DOWN:
      {
        state = ledgerApi.quit(state)
        break
      }
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults') || Immutable.Map()
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('publishersClear')) {
          state = ledgerApi.resetPublishers(state)
        }

        if (clearData.get('paymentHistory')) {
          state = ledgerApi.clearPaymentHistory(state)
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
        }
        break
      }
    case appConstants.APP_ON_LEDGER_PIN_PUBLISHER:
      {
        const value = action.get('value')
        const publisherKey = action.get('publisherKey')
        const publisher = ledgerState.getPublisher(state, publisherKey)

        if (publisher.isEmpty() || publisher.get('pinPercentage') === value) {
          break
        }

        state = ledgerState.setPublishersProp(state, publisherKey, 'pinPercentage', value)
        ledgerApi.savePublisherData(publisherKey, 'pinPercentage', value)
        state = ledgerApi.updatePublisherInfo(state, publisherKey)
        break
      }
    case appConstants.APP_ADD_PUBLISHER_TO_LEDGER:
      {
        const tabId = action.get('tabId')
        const location = action.get('location')

        if (!location) {
          break
        }

        const passedTabId = tabId || tabState.TAB_ID_NONE

        state = ledgerApi.addNewLocation(state, location, passedTabId, false, true)
        state = ledgerApi.pageDataChanged(state, {}, true)
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
        state = ledgerApi.onFavIconReceived(state, action.get('publisherKey'), action.get('blob'))
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
    case appConstants.APP_ON_PUBLISHER_OPTION_UPDATE:
      {
        const value = action.get('value')
        const key = action.get('publisherKey')
        const prop = action.get('prop')
        state = ledgerState.setPublisherOption(state, key, prop, value)
        break
      }
    case appConstants.APP_ON_PUBLISHERS_OPTION_UPDATE:
      {
        state = ledgerApi.setPublishersOptions(state, action.get('publishersArray'))
        break
      }
    case appConstants.APP_ON_LEDGER_WALLET_CREATE:
      {
        ledgerApi.boot()
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
        state = ledgerApi.paymentPresent(state, action.get('tabId'), action.get('present'))
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
        state = aboutPreferencesState.setRecoveryStatus(state, null)
        state = ledgerState.setInfoProp(state, 'error', null)
        break
      }
    case appConstants.APP_ON_LEDGER_INIT_READ:
      {
        state = ledgerApi.onInitRead(state, action.parsedData)
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
    case tabActionConstants.FINISH_NAVIGATION:
      {
        if (!getSetting(settings.PAYMENTS_ENABLED)) {
          break
        }

        // create a page view event if this is a page load on the active tabId
        const lastActiveTabId = pageDataState.getLastActiveTabId(state)
        const tabId = action.get('tabId')
        const tab = getWebContents(tabId)
        if (tab && !tab.isDestroyed()) {
          if (!lastActiveTabId || tabId === lastActiveTabId) {
            state = ledgerApi.pageDataChanged(state, {
              location: tab.getURL(),
              tabId
            })
          }
        }
        break
      }
    case appConstants.APP_ON_PUBLISHER_TIMESTAMP:
      {
        const oldValue = ledgerState.getLedgerValue(state, 'publisherTimestamp')
        state = ledgerState.setLedgerValue(state, 'publisherTimestamp', action.get('timestamp'))
        if (action.get('updateList')) {
          ledgerApi.onPublisherTimestamp(state, oldValue, action.get('timestamp'))
        }
        break
      }
    case appConstants.APP_SAVE_LEDGER_PROMOTION:
      {
        state = ledgerState.savePromotion(state, action.get('promotion'))
        state = ledgerNotifications.onPromotionReceived(state)
        break
      }
    case appConstants.APP_ON_PROMOTION_CLICK:
      {
        ledgerApi.getCaptcha(state)
        break
      }
    case appConstants.APP_ON_CAPTCHA_RESPONSE:
      {
        state = ledgerApi.onCaptchaResponse(state, action.get('response'), action.get('body'))
        break
      }
    case appConstants.APP_ON_CAPTCHA_CLOSE:
      {
        state = ledgerState.setPromotionProp(state, 'promotionStatus', null)
        break
      }
    case appConstants.APP_ON_PROMOTION_CLAIM:
      {
        ledgerApi.claimPromotion(state, action.get('x'), action.get('y'))
        break
      }
    case appConstants.APP_ON_PROMOTION_REMIND:
      {
        state = ledgerState.remindMeLater(state)
        break
      }
    case appConstants.APP_ON_LEDGER_MEDIA_DATA:
      {
        state = ledgerApi.onMediaRequest(state, action.get('url'), action.get('type'), action.get('details'))
        break
      }
    case appConstants.APP_ON_PRUNE_SYNOPSIS:
      {
        const publishers = action.get('publishers')

        if (publishers == null) {
          break
        }

        state = ledgerState.saveSynopsis(state, publishers)
        break
      }
    case appConstants.APP_ON_PROMOTION_RESPONSE:
      {
        state = ledgerApi.onPromotionResponse(state, action.get('status'))
        break
      }
    case appConstants.APP_ON_PROMOTION_REMOVAL:
      {
        ledgerNotifications.removePromotionNotification(state)
        state = ledgerState.removePromotion(state)
        break
      }
    case appConstants.APP_ON_LEDGER_NOTIFICATION_INTERVAL:
      {
        state = ledgerNotifications.onInterval(state)
        break
      }
    case appConstants.APP_ON_PROMOTION_GET:
      {
        ledgerApi.getPromotion(state)
        break
      }
    case appConstants.APP_ON_PROMOTION_CLOSE:
      {
        state = ledgerState.setPromotionProp(state, 'promotionStatus', null)
        break
      }
    case appConstants.APP_ON_REFERRAL_CODE_READ:
      {
        state = ledgerApi.onReferralRead(state, action.get('body'), windows.getActiveWindowId())
        break
      }
    case appConstants.APP_ON_REFERRAL_CODE_FAIL:
      {
        state = updateState.setUpdateProp(state, 'referralDownloadId', false)
        break
      }
    case appConstants.APP_CHECK_REFERRAL_ACTIVITY:
      {
        state = ledgerApi.checkReferralActivity(state)
        break
      }
    case appConstants.APP_ON_FETCH_REFERRAL_HEADERS:
      {
        state = ledgerApi.onFetchReferralHeaders(state, action.get('error'), action.get('response'), action.get('body'))
        break
      }
    case appConstants.APP_ON_LEDGER_FUZZING:
      {
        if (action.get('newStamp') != null) {
          const newStamp = parseInt(action.get('newStamp'))
          if (!isNaN(newStamp) && newStamp > 0) {
            state = ledgerState.setAboutProp(state, 'status', ledgerStatuses.FUZZING)
            state = ledgerState.setInfoProp(state, 'reconcileStamp', newStamp)
          }
        }

        if (action.get('pruned')) {
          state = ledgerApi.synopsisNormalizer(state, null, true, true)
        }
        break
      }
    case appConstants.APP_ON_REFERRAL_ACTIVITY:
      {
        state = updateState.setUpdateProp(state, 'referralTimestamp', new Date().getTime())
        state = updateState.deleteUpdateProp(state, 'referralAttemptTimestamp')
        state = updateState.deleteUpdateProp(state, 'referralAttemptCount')
        break
      }
    case appConstants.APP_ON_LEDGER_MEDIA_PUBLISHER:
      {
        state = ledgerApi.onMediaPublisher(
          state,
          action.get('mediaKey'),
          action.get('response'),
          action.get('duration'),
          action.get('revisited')
        )
        break
      }
    case appConstants.APP_ON_WALLET_PROPERTIES_ERROR:
      {
        state = ledgerState.setAboutProp(state, 'status', ledgerStatuses.SERVER_PROBLEM)
        break
      }
    case appConstants.APP_ON_LEDGER_BACKUP_SUCCESS:
      {
        state = aboutPreferencesState.setBackupStatus(state, true)
        break
      }
    case appConstants.APP_ON_WALLET_DELETE:
      {
        state = ledgerApi.deleteWallet(state)
        break
      }
    case appConstants.APP_ON_PUBLISHER_TOGGLE_UPDATE:
      {
        const viewData = makeJS(action.get('viewData'))
        state = ledgerApi.pageDataChanged(state, {}, true)
        state = ledgerApi.pageDataChanged(state, viewData, true)
        break
      }
    case appConstants.APP_RUN_PROMOTION_CHECK:
      {
        state = ledgerApi.onRunPromotionCheck(state, getSetting(settings.PAYMENTS_ENABLED))
        break
      }
    case appConstants.APP_ON_NOTIFICATION_RESPONSE:
      {
        state = ledgerNotifications.onResponse(
          state,
          action.get('message'),
          action.get('buttonIndex'),
          action.get('activeWindow')
        )
        break
      }
  }
  return state
}

process.on(messages.APP_INITIALIZED, () => {
  ledgerApi.runPromotionCheck()
})

module.exports = ledgerReducer
