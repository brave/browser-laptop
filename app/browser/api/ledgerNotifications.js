/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const ipc = electron.ipcMain

// Constants
const appConfig = require('../../../js/constants/appConfig')
const messages = require('../../../js/constants/messages')
const settings = require('../../../js/constants/settings')
const ledgerStatuses = require('../../common/constants/ledgerStatuses')

// State
const aboutPreferencesState = require('../../common/state/aboutPreferencesState')
const ledgerState = require('../../common/state/ledgerState')

// Actions
const appActions = require('../../../js/actions/appActions')

// Utils
const locale = require('../../locale')
const ledgerUtil = require('../../common/lib/ledgerUtil')
const getSetting = require('../../../js/settings').getSetting

const text = {
  hello: locale.translation('updateHello'),
  paymentDone: undefined,
  addFunds: locale.translation('addFundsNotification'),
  tryPayments: locale.translation('notificationTryPayments'),
  reconciliation: locale.translation('reconciliationNotification'),
  backupKeys: locale.translation('backupKeys')
}

const pollingInterval = process.env.LEDGER_NOTIFICATION ? ledgerUtil.milliseconds.second * 5 : 15 * ledgerUtil.milliseconds.minute // 15 * minute default production
let intervalTimeout
const displayOptions = {
  style: 'greetingStyle',
  persist: false
}
const nextAddFundsTime = 3 * ledgerUtil.milliseconds.day
let backupNotifyInterval = process.env.LEDGER_NOTIFICATION ? [2 * ledgerUtil.milliseconds.minute, 5 * ledgerUtil.milliseconds.minute] : [7 * ledgerUtil.milliseconds.day, 14 * ledgerUtil.milliseconds.day]

const sufficientBalanceToReconcile = (state) => {
  const balance = Number(ledgerState.getInfoProp(state, 'balance') || 0)
  const unconfirmed = Number(ledgerState.getInfoProp(state, 'unconfirmed') || 0)
  const budget = ledgerState.getContributionAmount(state)
  return balance + unconfirmed >= budget
}

const hasFunded = (state) => {
  return getSetting(settings.PAYMENTS_ENABLED)
  ? ledgerState.getInfoProp(state, 'userHasFunded') || false
  : false
}
const shouldShowNotificationReviewPublishers = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}
const shouldShowNotificationAddFunds = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}
const shouldShowAddFundsModal = (state) => {
  const ledgerStatus = ledgerState.getAboutProp(state, 'status') || ''
  return (
    ledgerStatus !== ledgerStatuses.SERVER_PROBLEM &&
    ledgerStatus !== ledgerStatuses.CORRUPTED_SEED
  )
}

const init = () => {
  // Check if relevant browser notifications should be shown every 15 minutes
  if (intervalTimeout) {
    clearInterval(intervalTimeout)
  }
  intervalTimeout = setInterval(() => {
    appActions.onLedgerNotificationInterval()
  }, pollingInterval)
}

const onInterval = (state) => {
  if (process.env.LEDGER_NOTIFICATION) {
    runDebugCounter()
  }
  if (getSetting(settings.PAYMENTS_ENABLED)) {
    if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
      state = module.exports.showEnabledNotifications(state)
    }
  } else {
    module.exports.showDisabledNotifications(state)
  }

  if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
    state = module.exports.onIntervalDynamic(state)
  }

  return state
}

const onIntervalDynamic = (state) => {
  const promotion = ledgerState.getPromotion(state)
  const time = new Date().getTime()

  if (promotion.isEmpty()) {
    return state
  }

  const timestamp = promotion.get('remindTimestamp')
  if (timestamp && timestamp !== -1 && time > timestamp) {
    state = ledgerState.setPromotionProp(state, 'remindTimestamp', -1)
    module.exports.showPromotionNotification(state)
  }

  return state
}

const onResponse = (state, message, buttonIndex, activeWindow) => {
  switch (message) {
    case text.addFunds:
      // See showNotificationAddFunds() for buttons.
      // buttonIndex === 1 is "Later"; the timestamp until which to delay is set
      // in showNotificationAddFunds() when triggering this notification.
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && activeWindow) {
        const addFundsOverlay = shouldShowAddFundsModal(state) ? '?addFundsOverlayVisible' : ''
        // Add funds: Open payments panel
        appActions.createTabRequested({
          url: `about:preferences#payments${addFundsOverlay}`,
          windowId: activeWindow.id
        })
      }
      break

    case text.reconciliation:
      // buttonIndex === 1 is Dismiss
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && activeWindow) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: activeWindow.id
        })
      }
      break

    case text.paymentDone:
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      }
      break

    case text.tryPayments:
      if (buttonIndex === 1 && activeWindow) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: activeWindow.id
        })
      }
      appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
      break

    case text.backupKeys:
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && activeWindow) {
        appActions.createTabRequested({
          url: 'about:preferences#payments?ledgerBackupOverlayVisible',
          windowId: activeWindow.id
        })
      }
      break
    default:
      return state
  }

  appActions.hideNotification(message)

  return state
}

const onDynamicResponse = (message, actionId, activeWindow) => {
  if (!message) {
    return
  }

  switch (actionId) {
    case 'optInPromotion':
      {
        if (activeWindow) {
          appActions.createTabRequested({
            url: 'about:preferences#payments',
            windowId: activeWindow.id
          })
        }
        break
      }
    case 'remindLater':
      {
        appActions.onPromotionRemind()
        break
      }
    case 'noThanks':
      {
        appActions.changeSetting(settings.PAYMENTS_ALLOW_PROMOTIONS, false)
        break
      }
  }

  appActions.hideNotification(message)
}

/**
 * Show message that it's time to add funds if reconciliation is less than
 * a day in the future and balance is too low.
 * 24 hours prior to reconciliation, show message asking user to review
 * their votes.
 *
 * If not time to reconcile, check to show backup notification ()
 */
const showEnabledNotifications = (state) => {
  const now = new Date().getTime()
  let bootStamp = ledgerState.getInfoProp(state, 'bootStamp')
  const reconcileStamp = ledgerState.getInfoProp(state, 'reconcileStamp')
  if (!reconcileStamp) {
    return state
  }
  if (reconcileStamp - now < ledgerUtil.milliseconds.day) {
    if (sufficientBalanceToReconcile(state)) {
      if (shouldShowNotificationReviewPublishers()) {
        const reconcileFrequency = ledgerState.getInfoProp(state, 'reconcileFrequency')
        showReviewPublishers(reconcileStamp + ((reconcileFrequency - 2) * ledgerUtil.milliseconds.day))
      }
    } else if (shouldShowNotificationAddFunds()) {
      showAddFunds()
    }
  } else if (reconcileStamp - now < 2 * ledgerUtil.milliseconds.day) {
    if (sufficientBalanceToReconcile(state) && (shouldShowNotificationReviewPublishers())) {
      showReviewPublishers(now + ledgerUtil.milliseconds.day)
    }
  } else if (hasFunded(state) && !aboutPreferencesState.hasBeenBackedUp(state)) {
    const backupNotifyCount = aboutPreferencesState.getPreferencesProp(state, 'backupNotifyCount') || 0
    const backupNotifyTimestamp = aboutPreferencesState.getPreferencesProp(state, 'backupNotifyTimestamp') || backupNotifyInterval[0]
    if (!bootStamp) {
      bootStamp = now
      state = ledgerState.setInfoProp(state, 'bootStamp', bootStamp)
    }
    if (now - bootStamp > backupNotifyTimestamp) {
      const nextTime = backupNotifyTimestamp + getNextBackupNotification(state, backupNotifyCount + 1, backupNotifyInterval) // set next time to notify case for remind later
      state = aboutPreferencesState.setPreferencesProp(state, 'backupNotifyCount', (backupNotifyCount + 1))
      state = aboutPreferencesState.setPreferencesProp(state, 'backupNotifyTimestamp', nextTime)
      module.exports.showBackupKeys(nextTime)
    }
    if (process.env.LEDGER_NOTIFICATION) {
      watchNotificationTimers(now, bootStamp, backupNotifyCount, backupNotifyTimestamp)
    }
  }
  return state
}

const getNextBackupNotification = (state, count, interval) => {
  if (count >= (interval && interval.constructor === Array ? interval.length : 0)) {
    if (process.env.LEDGER_NOTIFICATION) {
      return ledgerUtil.milliseconds.minute
    }
    return ledgerUtil.milliseconds.month
  }
  return interval[count]
}

const showDisabledNotifications = (state) => {
  if (!getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    const firstRunTimestamp = state.get('firstRunTimestamp')
    if (new Date().getTime() - firstRunTimestamp < appConfig.payments.delayNotificationTryPayments) {
      return
    }

    appActions.showNotification({
      position: 'global',
      greeting: locale.translation('updateHello'),
      message: text.tryPayments,
      buttons: [
        {text: locale.translation('noThanks')},
        {text: locale.translation('notificationTryPaymentsYes'), className: 'primaryButton'}
      ],
      options: displayOptions
    })
  }
}

const showBackupKeys = (nextTime) => {
  appActions.showNotification({
    position: 'global',
    greeting: text.hello,
    message: text.backupKeys,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('updateLater')},
      {text: locale.translation('backupKeysNow'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

const showReviewPublishers = (nextTime) => {
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP, nextTime)

  appActions.showNotification({
    position: 'global',
    greeting: text.hello,
    message: text.reconciliation,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('dismiss')},
      {text: locale.translation('reviewSites'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

const showAddFunds = () => {
  const nextTime = new Date().getTime() + nextAddFundsTime
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP, nextTime)

  appActions.showNotification({
    position: 'global',
    greeting: text.hello,
    message: text.addFunds,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('updateLater')},
      {text: locale.translation('addFunds'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

// Called from observeTransactions() when we see a new payment (transaction).
const showPaymentDone = (transactionContribution) => {
  text.paymentDone = locale.translation('notificationPaymentDone')
    .replace(/{{\s*amount\s*}}/, ledgerUtil.probiToFormat(transactionContribution.get('probi')))
    .replace(/{{\s*currency\s*}}/, transactionContribution.getIn(['fiat', 'currency']))
  // Hide the 'waiting for deposit' message box if it exists
  appActions.hideNotification(text.addFunds)
  appActions.showNotification({
    position: 'global',
    greeting: locale.translation('updateHello'),
    message: text.paymentDone,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('Ok'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

const onPromotionReceived = (state) => {
  const promotion = ledgerState.getPromotionNotification(state)

  if (!promotion.isEmpty() && !promotion.has('firstShowTimestamp')) {
    state = ledgerState.setPromotionNotificationProp(state, 'firstShowTimestamp', new Date().getTime())
    showPromotionNotification(state)
  }

  return state
}

const showPromotionNotification = (state) => {
  const notification = ledgerState.getPromotionNotification(state)

  if (
    notification.isEmpty() ||
    (
      getSetting(settings.PAYMENTS_ENABLED) &&
      !getSetting(settings.PAYMENTS_NOTIFICATIONS)
    ) ||
    !getSetting(settings.PAYMENTS_ALLOW_PROMOTIONS)
  ) {
    return
  }

  const data = notification.toJS()
  data.position = 'global'

  if (data.buttons) {
    data.buttons.unshift({
      text: locale.translation('noThanks'),
      buttonActionId: 'noThanks'
    })
  }

  appActions.showNotification(data)
}

const removePromotionNotification = (state) => {
  const notification = ledgerState.getPromotionNotification(state)

  if (notification.isEmpty()) {
    return
  }

  appActions.hideNotification(notification.get('message'))
}

const watchNotificationTimers = (now, bootStamp, backupNotifyCount, backupNotifyTimestamp) => { // for testing
  console.log('now - bootstamp: ' + (now - bootStamp))
  console.log('count: ' + backupNotifyCount)
  console.log('backupNotifyTimestamp: ' + backupNotifyTimestamp)
}

const runDebugCounter = () => {
  console.log(new Date().getTime() / ledgerUtil.milliseconds.second)
}

if (ipc) {
  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, checkbox, index, buttonActionId) => {
    if (buttonActionId) {
      onDynamicResponse(
        message,
        buttonActionId,
        electron.BrowserWindow.getActiveWindow()
      )
      return
    }

    appActions.onNotificationResponse(
      message,
      buttonIndex,
      electron.BrowserWindow.getActiveWindow()
    )
  })
}

const getMethods = () => {
  const publicMethods = {
    showPaymentDone,
    init,
    onInterval,
    onPromotionReceived,
    removePromotionNotification,
    showDisabledNotifications,
    showEnabledNotifications,
    onIntervalDynamic,
    showPromotionNotification,
    showBackupKeys,
    hasFunded,
    shouldShowAddFundsModal,
    getNextBackupNotification,
    onResponse
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      setTimeOut: (data) => {
        intervalTimeout = data
      },
      getTimeOut: () => {
        return intervalTimeout
      },
      getPollingInterval: () => {
        return pollingInterval
      },
      onDynamicResponse,
      sufficientBalanceToReconcile
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
