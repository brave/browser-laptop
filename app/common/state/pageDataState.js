/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Utils
const pageDataUtil = require('../lib/pageDataUtil')
const {getWebContents} = require('../../browser/webContentsCache')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')
const {makeImmutable} = require('./immutableUtil')

const pageDataState = {
  addView: (state, url = null, tabId = null) => {
    const tab = getWebContents(tabId)
    const isPrivate = !tab ||
      tab.isDestroyed() ||
      !tab.session.partition.startsWith('persist:')

    state = pageDataState.setLastActiveTabId(state, tabId)

    if ((url && isSourceAboutUrl(url)) || isPrivate) {
      url = null
    }

    const lastView = pageDataState.getView(state)
    if (lastView.get('url') === url) {
      return state
    }

    let pageViewEvent = makeImmutable({
      timestamp: new Date().getTime(),
      url,
      tabId
    })
    state = state.setIn(['pageData', 'last', 'url'], url)
    return state.setIn(['pageData', 'view'], pageViewEvent)
  },

  addInfo: (state, data) => {
    if (data == null) {
      return state
    }

    data = makeImmutable(data)

    const key = pageDataUtil.getInfoKey(data.get('url'))

    data = data.set('key', key)
    state = state.setIn(['pageData', 'last', 'info'], key)
    return state.setIn(['pageData', 'info', key], data)
  },

  resetInfo: (state) => {
    return state.setIn(['pageData', 'last', 'info'], '')
  },

  addLoad: (state, data) => {
    if (data == null) {
      return state
    }

    // select only last 100 loads
    const newLoad = state.getIn(['pageData', 'load'], Immutable.List()).slice(-100).push(data)
    return state.setIn(['pageData', 'load'], newLoad)
  },

  getView: (state) => {
    return state.getIn(['pageData', 'view']) || Immutable.Map()
  },

  getLastUrl: (state) => {
    return state.getIn(['pageData', 'last', 'url'])
  },

  getLastInfo: (state) => {
    const key = state.getIn(['pageData', 'last', 'info'])

    if (key == null) {
      return Immutable.Map()
    }

    return state.getIn(['pageData', 'info', key], Immutable.Map())
  },

  getLoad: (state) => {
    return state.getIn(['pageData', 'load'], Immutable.List())
  },

  getLastActiveTabId: (state) => {
    return state.getIn(['pageData', 'last', 'tabId'])
  },

  setLastActiveTabId: (state, tabId) => {
    return state.setIn(['pageData', 'last', 'tabId'], tabId)
  },

  setPublisher: (state, key, publisher) => {
    if (key == null) {
      return state
    }

    return state.setIn(['pageData', 'info', key, 'publisher'], publisher)
  },

  resetPageData: (state) => {
    return state
      .setIn(['pageData', 'load'], Immutable.List())
      .setIn(['pageData', 'info'], Immutable.Map())
      .setIn(['pageData', 'view'], Immutable.Map())
      .setIn(['pageData', 'last', 'info'], null)
      .setIn(['pageData', 'last', 'url'], null)
      .setIn(['pageData', 'last', 'tabId'], null)
  }
}

module.exports = pageDataState
