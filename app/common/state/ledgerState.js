/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Utils
const siteSettings = require('../../../js/state/siteSettings')
const {makeImmutable} = require('../../common/state/immutableUtil')

const ledgerState = {
  setRecoveryStatus: (state, status) => {
    const date = new Date().getTime()
    state = state.setIn(['about', 'preferences', 'recoverySucceeded'], status)
    return state.setIn(['about', 'preferences', 'updatedStamp'], date)
  },

  setLedgerError: (state, error, caller) => {
    if (error == null && caller == null) {
      return state.setIn(['ledger', 'info', 'error'], null)
    }

    return state
      .setIn(['ledger', 'info', 'error', 'caller'], caller)
      .setIn(['ledger', 'info', 'error', 'error'], error)
  },

  getLocation: (state, url) => {
    if (url == null) {
      return null
    }

    return state.getIn(['ledger', 'locations', url])
  },

  changePinnedValues: (state, publishers) => {
    if (publishers == null) {
      return state
    }

    publishers = makeImmutable(publishers)
    publishers.forEach((item, index) => {
      const pattern = `https?://${index}`
      const percentage = item.get('pinPercentage')
      let newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPinPercentage', percentage)
      state = state.set('siteSettings', newSiteSettings)
    })

    return state
  },

  getSynopsis: (state) => {
    return state.getIn(['ledger', 'synopsis']) || Immutable.Map()
  },

  saveSynopsis: (state, publishers, options) => {
    return state
      .setIn(['ledger', 'synopsis', 'publishers'], publishers)
      .setIn(['ledger', 'synopsis', 'options'], options)
  },

  getPublisher: (state, key) => {
    if (key == null) {
      return Immutable.Map()
    }

    return state.getIn(['ledger', 'synopsis', 'publishers', key]) || Immutable.Map()
  },

  getPublishers: (state) => {
    return state.getIn(['ledger', 'synopsis', 'publishers']) || Immutable.Map()
  },

  deletePublishers: (state, key) => {
    return state.deleteIn(['ledger', 'synopsis', 'publishers', key])
  },

  getSynopsisOption: (state, prop) => {
    if (prop == null) {
      return state.getIn(['ledger', 'synopsis', 'options'])
    }

    return state.getIn(['ledger', 'synopsis', 'options', prop])
  },

  setSynopsisOption: (state, prop, value) => {
    if (prop == null) {
      return state
    }

    return state.setIn(['ledger', 'synopsis', 'options', prop], value)
  },

  enableUndefinedPublishers: (state, publishers) => {
    const sitesObject = state.get('siteSettings')
    Object.keys(publishers).map((item) => {
      const pattern = `https?://${item}`
      const result = sitesObject.getIn([pattern, 'ledgerPayments'])

      if (result === undefined) {
        const newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPayments', true)
        state = state.set('siteSettings', newSiteSettings)
      }
    })

    return state
  },

  getInfoProp: (state, prop) => {
    if (prop == null) {
      return state.getIn(['ledger', 'info'])
    }

    return state.getIn(['ledger', 'info', prop])
  },

  setInfoProp: (state, prop, value) => {
    if (prop == null) {
      return state
    }

    return state.setIn(['ledger', 'info', prop], value)
  },

  mergeInfoProp: (state, data) => {
    if (data == null) {
      return state
    }

    const oldData = ledgerState.getInfoProp()
    return state.setIn(['ledger', 'info'], oldData.merge(data))
  },

  resetInfo: (state) => {
    return state.setIn(['ledger', 'info'], {})
  },

  resetSynopsis: (state) => {
    return state.deleteIn(['ledger', 'synopsis'])
  }
}

module.exports = ledgerState
