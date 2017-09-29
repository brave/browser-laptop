/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const assert = require('assert')

// Utils
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

  resetSynopsis: (state) => {
    state = validateState(state)
    return state
      .setIn(['ledger', 'synopsis', 'options'], Immutable.Map())
      .setIn(['ledger', 'synopsis', 'publishers'], Immutable.Map())
      .setIn(['ledger', 'locations'], Immutable.Map())
      .setIn(['ledger', 'about', 'synopsis'], Immutable.Map())
      .setIn(['ledger', 'about', 'synopsisOptions'], Immutable.Map())
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
      return state
    }

    return state.getIn(['ledger', 'synopsis', 'publishers', key, 'options', prop])
  },
  getSynopsisOption: (state, prop) => {
    state = validateState(state)
    if (prop == null) {
      return null
    }

    return state.getIn(['ledger', 'synopsis', 'options', prop], null)
  },

  /**
   * SYNOPSIS / OPTIONS
   */
  getSynopsisOptions: (state) => {
    state = validateState(state)
    return state.getIn(['ledger', 'synopsis', 'options']) || Immutable.Map()
  },

  setSynopsisOption: (state, prop, value) => {
    state = validateState(state)
    if (prop == null) {
      return state
    }

    return state.setIn(['ledger', 'synopsis', 'options', prop], value)
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

  resetInfo: (state) => {
    state = validateState(state)
    return state.setIn(['ledger', 'info'], Immutable.Map())
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

    return state
      .setIn(['ledger', 'info', 'error', 'caller'], caller)
      .setIn(['ledger', 'info', 'error', 'error'], error)
  },

  changePinnedValues: (state, publishers) => {
    state = validateState(state)
    if (publishers == null) {
      return state
    }

    publishers = makeImmutable(publishers)
    publishers.forEach((item) => {
      const publisherKey = item.get('site')
      const pattern = urlUtil.getHostPattern(publisherKey)
      const percentage = item.get('pinPercentage')
      let newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPinPercentage', percentage)
      state = state.set('siteSettings', newSiteSettings)
    })

    return state
  },

  enableUndefinedPublishers: (state, publishers) => {
    state = validateState(state)
    const sitesObject = state.get('siteSettings')

    if (publishers == null) {
      return state
    }

    for (let item of publishers) {
      const key = item[0]
      const pattern = urlUtil.getHostPattern(key)
      const result = sitesObject.getIn([pattern, 'ledgerPayments'])

      if (result === undefined) {
        const newSiteSettings = siteSettings.mergeSiteSetting(state.get('siteSettings'), pattern, 'ledgerPayments', true)
        state = state.set('siteSettings', newSiteSettings)
      }
    }

    return state
  },

  // TODO (optimization) don't have two almost identical object in state (synopsi->publishers and about->synopsis)
  saveAboutSynopsis: (state, publishers) => {
    state = validateState(state)
    return state
      .setIn(['ledger', 'about', 'synopsis'], publishers)
      .setIn(['ledger', 'about', 'synopsisOptions'], ledgerState.getSynopsisOptions(state))
  }
}

module.exports = ledgerState
