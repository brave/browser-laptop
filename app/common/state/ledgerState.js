/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const pageDataState = require('./pageDataState')

// Constants
const settings = require('../../../js/constants/settings')

// Utils
const getSetting = require('../../../js/settings').getSetting
const siteSettings = require('../../../js/state/siteSettings')
const urlUtil = require('../../../js/lib/urlutil')
const {makeImmutable, isMap} = require('../../common/state/immutableUtil')

const validateState = function (state) {
  state = makeImmutable(state)
  assert.ok(isMap(state), 'state must be an Immutable.Map')
  assert.ok(isMap(state.get('ledger')), 'state must contain an Immutable.Map of ledger')
  return state
}

const ledgerState = {
  /**
   * LEDGER
   */
  setLedgerValue: (state, key, value) => {
    state = validateState(state)
    if (key == null) {
      return state
    }

    return state.setIn(['ledger', key], value)
  },

  getLedgerValue: (state, key) => {
    state = validateState(state)

    return state.getIn(['ledger', key])
  },

  /**
   * LOCATIONS
   */
  getLocation: (state, url) => {
    state = validateState(state)
    if (url == null) {
      return Immutable.Map()
    }

    return state.getIn(['ledger', 'locations', url]) || Immutable.Map()
  },

  setLocationProp: (state, url, prop, value) => {
    state = validateState(state)
    if (url == null || prop == null) {
      return state
    }

    return state.setIn(['ledger', 'locations', url, prop], value)
  },

  getLocationProp: (state, url, prop) => {
    state = validateState(state)
    if (url == null || prop == null) {
      return null
    }

    return state.getIn(['ledger', 'locations', url, prop])
  },

  getLocationPublisher: (state, url) => {
    state = validateState(state)
    if (url == null) {
      return Immutable.Map()
    }

    return state.getIn(['ledger', 'locations', url])
  },

  /**
   * SYNOPSIS
   */
  getSynopsis: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'synopsis']) || Immutable.Map()
  },

  saveSynopsis: (state, publishers, options) => {
    state = validateState(state)
    if (options != null) {
      state = state.setIn(['ledger', 'synopsis', 'options'], makeImmutable(options))
    }

    if (publishers != null) {
      state = state.setIn(['ledger', 'synopsis', 'publishers'], makeImmutable(publishers))
    }

    return state
  },

  resetSynopsis: (state, options = false) => {
    state = validateState(state)

    if (options) {
      state = state
        .setIn(['ledger', 'synopsis', 'options'], Immutable.Map())
        .setIn(['ledger', 'about', 'synopsisOptions'], Immutable.Map())
    }

    state = pageDataState.resetPageData(state)

    return state
      .setIn(['ledger', 'synopsis', 'publishers'], Immutable.Map())
      .setIn(['ledger', 'locations'], Immutable.Map())
      .setIn(['ledger', 'about', 'synopsis'], Immutable.List())
  },

  /**
   * SYNOPSIS / PUBLISHERS
   */
  getPublisher: (state, key) => {
    state = validateState(state)
    if (key == null) {
      return Immutable.Map()
    }

    return state.getIn(['ledger', 'synopsis', 'publishers', key]) || Immutable.Map()
  },

  getPublishers: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'synopsis', 'publishers']) || Immutable.Map()
  },

  hasPublisher: (state, key) => {
    state = validateState(state)
    if (key == null) {
      return false
    }

    return state.hasIn(['ledger', 'synopsis', 'publishers', key])
  },

  setPublisher: (state, key, value) => {
    state = validateState(state)
    if (key == null || value == null) {
      return state
    }

    value = makeImmutable(value)
    return state.setIn(['ledger', 'synopsis', 'publishers', key], value)
  },

  deletePublishers: (state, key) => {
    state = validateState(state)

    if (key == null) {
      return state
    }

    return state.deleteIn(['ledger', 'synopsis', 'publishers', key])
  },

  setPublishersProp: (state, key, prop, value) => {
    state = validateState(state)

    if (key == null || prop == null) {
      return state
    }

    return state.setIn(['ledger', 'synopsis', 'publishers', key, prop], value)
  },

  /**
   * SYNOPSIS / PUBLISHER / OPTIONS
   */
  setPublisherOption: (state, key, prop, value) => {
    state = validateState(state)

    if (key == null || prop == null) {
      return state
    }

    return state.setIn(['ledger', 'synopsis', 'publishers', key, 'options', prop], value)
  },

  getPublisherOption: (state, key, prop) => {
    state = validateState(state)

    if (key == null || prop == null) {
      return null
    }

    return state.getIn(['ledger', 'synopsis', 'publishers', key, 'options', prop])
  },

  /**
   * SYNOPSIS / OPTIONS
   */
  getSynopsisOption: (state, prop) => {
    state = validateState(state)
    if (prop == null) {
      return null
    }

    return state.getIn(['ledger', 'synopsis', 'options', prop], null)
  },

  getSynopsisOptions: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'synopsis', 'options']) || Immutable.Map()
  },

  setSynopsisOption: (state, prop, value) => {
    state = validateState(state)
    if (prop == null) {
      return state
    }

    state = state.setIn(['ledger', 'synopsis', 'options', prop], value)
    state = ledgerState.setAboutSynopsisOptions(state)

    return state
  },

  /**
   * INFO
   */
  getInfoProp: (state, prop) => {
    state = validateState(state)
    if (prop == null) {
      return null
    }

    return state.getIn(['ledger', 'info', prop], null)
  },

  getInfoProps: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'info']) || Immutable.Map()
  },

  setInfoProp: (state, prop, value) => {
    state = validateState(state)
    if (prop == null) {
      return state
    }

    return state.setIn(['ledger', 'info', prop], value)
  },

  mergeInfoProp: (state, data) => {
    state = validateState(state)
    if (data == null) {
      return state
    }

    data = makeImmutable(data)

    // clean-up
    if (data.has('publishersV2')) {
      data = data.set('publishersV2Stamp', data.getIn(['publishersV2', 'publishersV2Stamp']))
      data = data.delete('publishersV2')
    }
    if (data.has('rulesetV2')) {
      data = data.set('rulesV2Stamp', data.getIn(['rulesetV2', 'rulesV2Stamp']))
      data = data.delete('rulesetV2')
    }

    const oldData = ledgerState.getInfoProps(state)
    return state.setIn(['ledger', 'info'], oldData.merge(data))
  },

  resetInfo: (state, keep) => {
    state = validateState(state)
    let newData = Immutable.Map()

    if (keep) {
      const paymentId = ledgerState.getInfoProp(state, 'paymentId')
      if (paymentId) {
        newData = newData.set('paymentId', paymentId)
      }
    }

    return state.setIn(['ledger', 'info'], newData)
  },

  saveQRCode: (state, currency, image) => {
    state = validateState(state)
    if (currency == null) {
      return state
    }

    return state.setIn(['ledger', 'info', 'walletQR', currency], image)
  },

  /**
   * Functions returns default monthly amount
   * If user did not select it from the drop down we use defaults
   *
   * @param {any} state - app state
   * @param {float} amount - custom amount, when we are using partial state
   * @param {object} settingsCollection - settings object (used in about pages)
   */
  getContributionAmount: (state, amount, settingsCollection) => {
    const value = getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, settingsCollection, false)

    if (value === null) {
      amount = parseFloat(amount)

      if (state != null) {
        state = validateState(state)
        amount = ledgerState.getInfoProp(state, 'contributionAmount')
      }

      if (amount > 0) {
        return amount
      }
    }

    return parseFloat(getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, settingsCollection) || 5)
  },

  /**
   * OTHERS
   */
  setRecoveryStatus: (state, status) => {
    state = validateState(state)
    const date = new Date().getTime()
    state = state.setIn(['about', 'preferences', 'recoverySucceeded'], status)
    return state.setIn(['about', 'preferences', 'updatedStamp'], date)
  },

  setLedgerError: (state, error, caller) => {
    state = validateState(state)
    if (error == null && caller == null) {
      return state.setIn(['ledger', 'info', 'error'], null)
    }

    return state.setIn(['ledger', 'info', 'error'], Immutable.fromJS({
      caller: caller,
      error: error
    }))
  },

  changePinnedValues: (state, publishers) => {
    state = validateState(state)
    if (publishers == null) {
      return state
    }

    publishers = makeImmutable(publishers)
    publishers.forEach((item) => {
      const publisherKey = item.get('publisherKey')
      const pattern = urlUtil.getHostPattern(publisherKey)
      const percentage = item.get('pinPercentage')
      let newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPinPercentage', percentage)
      state = state.set('siteSettings', newSiteSettings)
    })

    return state
  },

  /**
   * PROMOTIONS
   */
  savePromotion: (state, promotion) => {
    state = validateState(state)

    if (promotion == null) {
      return state
    }

    promotion = makeImmutable(promotion)

    const oldPromotion = ledgerState.getPromotion(state)

    if (promotion.get('promotionId') === oldPromotion.get('promotionId')) {
      promotion = oldPromotion.mergeDeep(promotion)
    } else {
      if (!oldPromotion.isEmpty()) {
        const notification = ledgerState.getPromotionNotification(state)
        appActions.hideNotification(notification.get('message'))
      }

      promotion = promotion.set('remindTimestamp', -1)
    }

    state = state.setIn(['ledger', 'promotion'], promotion)
    return ledgerState.setActivePromotion(state)
  },

  getPromotion: (state) => {
    state = validateState(state)

    return state.getIn(['ledger', 'promotion']) || Immutable.Map()
  },

  setActivePromotion: (state, paymentsEnabled = null) => {
    state = validateState(state)
    const promotion = ledgerState.getPromotion(state)

    if (promotion.isEmpty()) {
      return state
    }

    if (paymentsEnabled === null) {
      paymentsEnabled = getSetting(settings.PAYMENTS_ENABLED)
    }

    let active = 'disabledWallet'
    if (paymentsEnabled) {
      const balance = ledgerState.getInfoProp(state, 'balance') || 0

      if (balance > 0) {
        active = 'fundedWallet'
      } else {
        active = 'emptyWallet'
      }
    }

    return ledgerState.setPromotionProp(state, 'activeState', active)
  },

  getActivePromotion: (state) => {
    state = validateState(state)
    const active = state.getIn(['ledger', 'promotion', 'activeState'])

    if (!active) {
      return Immutable.Map()
    }

    return state.getIn(['ledger', 'promotion', 'stateWallet', active]) || Immutable.Map()
  },

  setPromotionProp: (state, prop, value) => {
    state = validateState(state)

    if (prop == null) {
      return state
    }

    return state.setIn(['ledger', 'promotion', prop], value)
  },

  getPromotionProp: (state, prop) => {
    state = validateState(state)

    if (prop == null) {
      return null
    }

    return state.getIn(['ledger', 'promotion', prop])
  },

  removePromotion: (state) => {
    state = validateState(state)
    return state.setIn(['ledger', 'promotion'], Immutable.Map())
  },

  remindMeLater: (state, time) => {
    const ledgerUtil = require('../lib/ledgerUtil')
    if (time == null) {
      time = 24 * ledgerUtil.milliseconds.hour
    }

    state = validateState(state)

    return ledgerState.setPromotionProp(state, 'remindTimestamp', new Date().getTime() + time)
  },

  /**
   * PROMOTIONS / NOTIFICATION
   */

  getPromotionNotification: (state) => {
    state = validateState(state)

    const promotion = ledgerState.getActivePromotion(state)

    return promotion.get('notification') || Immutable.Map()
  },

  setPromotionNotificationProp: (state, prop, value) => {
    state = validateState(state)

    if (prop == null) {
      return state
    }

    const active = state.getIn(['ledger', 'promotion', 'activeState'])

    if (active == null) {
      return state
    }

    const path = ['ledger', 'promotion', 'stateWallet', active, 'notification', prop]

    return state.setIn(path, value)
  },

  /**
   * ABOUT PAGE
   */
  // TODO (optimization) don't have two almost identical object in state (synopsi->publishers and about->synopsis)
  saveAboutSynopsis: (state, publishers) => {
    state = validateState(state)
    return state
      .setIn(['ledger', 'about', 'synopsis'], publishers)
      .setIn(['ledger', 'about', 'synopsisOptions'], ledgerState.getSynopsisOptions(state))
  },

  setAboutSynopsisOptions: (state) => {
    state = validateState(state)
    return state
      .setIn(['ledger', 'about', 'synopsisOptions'], ledgerState.getSynopsisOptions(state))
  },

  getAboutData: (state) => {
    return state.getIn(['ledger', 'about']) || Immutable.Map()
  },

  saveWizardData: (state, page, currency) => {
    state = validateState(state)
    return state.mergeIn(['ledger', 'wizardData'], {
      currentPage: page,
      currency: currency
    })
  },

  geWizardData: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'wizardData']) || Immutable.Map()
  },

  getAboutPromotion: (state) => {
    let promotion = ledgerState.getActivePromotion(state)
    const claim = state.getIn(['ledger', 'promotion', 'claimedTimestamp']) || null
    const status = state.getIn(['ledger', 'promotion', 'promotionStatus']) || null

    if (claim) {
      promotion = promotion.set('claimedTimestamp', claim)
    }

    if (status) {
      promotion = promotion.set('promotionStatus', status)
    }

    return promotion
  }
}

module.exports = ledgerState
