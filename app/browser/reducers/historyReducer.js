/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const BrowserWindow = require('electron').BrowserWindow

// Actions
const appActions = require('../../../js/actions/appActions')

// State
const historyState = require('../../common/state/historyState')
const aboutHistoryState = require('../../common/state/aboutHistoryState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const {STATE_SITES} = require('../../../js/constants/stateConstants')
const messages = require('../../../js/constants/messages')
const settings = require('../../../js/constants/settings')

// Utils
const urlParse = require('../../common/urlParse')
const {makeImmutable} = require('../../common/state/immutableUtil')
const {remove} = require('../../common/lib/siteSuggestions')
const syncUtil = require('../../../js/state/syncUtil')
const filtering = require('../../filtering')
const {calculateTopSites} = require('../api/topSites')
const bookmarkLocationCache = require('../../common/cache/bookmarkLocationCache')
const {getSetting} = require('../../../js/settings')

/**
 * Helper to pass message to windows to clear closed frames
 * @param {Array.BrowserWindow} windows
 * @param {string} historyKey
 */
const clearClosedFrames = (windows, historyKey) => {
  windows.forEach((wnd) => {
    if (!wnd.webContents) {
      return
    }
    wnd.webContents.send(messages.CLEAR_CLOSED_FRAMES, historyKey.split('|')[0])
  })
}

let historyLimitTimout

const historyReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      {
        const defaults = state.get('clearBrowsingDataDefaults')
        const temp = state.get('tempClearBrowsingData', Immutable.Map())
        const clearData = defaults ? defaults.merge(temp) : temp
        if (clearData.get('browserHistory')) {
          let historyList = Immutable.List()
          historyState.getSites(state).forEach((site) => {
            const bookmarkKey = bookmarkLocationCache.getCacheKey(state, site.get('location'))
            if (bookmarkKey.size === 0) {
              historyList = historyList.push(site)
            }
          })

          remove(historyList)
          state = historyState.clearSites(state)
          state = aboutHistoryState.clearHistory(state)
          filtering.clearHistory()
        }
        break
      }
    case appConstants.APP_ADD_HISTORY_SITE:
      {
        const detail = action.get('siteDetail', Immutable.Map())

        if (detail.isEmpty()) {
          break
        }

        if (Immutable.List.isList(detail)) {
          detail.forEach((item) => {
            state = historyState.addSite(state, item)
            state = syncUtil.updateObjectCache(state, item, STATE_SITES.HISTORY_SITES)
          })
        } else {
          state = historyState.addSite(state, detail)
          state = syncUtil.updateObjectCache(state, detail, STATE_SITES.HISTORY_SITES)
        }

        calculateTopSites(true)
        state = aboutHistoryState.setHistory(state, historyState.getSites(state))

        if (historyLimitTimout) {
          clearTimeout(historyLimitTimout)
        }

        // keep only the latest history items (debounced for 1 min)
        historyLimitTimout = setTimeout(() => {
          appActions.onHistoryLimit()
        }, 60 * 1000)
        break
      }

    case appConstants.APP_REMOVE_HISTORY_SITE:
      {
        const historyKey = action.get('historyKey')
        if (historyKey == null) {
          break
        }
        const windows = BrowserWindow.getAllWindows()

        if (Immutable.List.isList(historyKey)) {
          action.get('historyKey', Immutable.List()).forEach((key) => {
            state = historyState.removeSite(state, key)
            clearClosedFrames(windows, key)
            // TODO: Implement Sync history site removal
            // state = syncUtil.updateObjectCache(state, action.get('siteDetail'), STATE_SITES.HISTORY_SITES)
          })
        } else {
          state = historyState.removeSite(state, historyKey)
          clearClosedFrames(windows, historyKey)
          // TODO: Implement Sync history site removal
          // state = syncUtil.updateObjectCache(state, action.get('siteDetail'), STATE_SITES.HISTORY_SITES)
        }

        calculateTopSites(true)
        state = aboutHistoryState.setHistory(state, historyState.getSites(state))
        break
      }

    case appConstants.APP_REMOVE_HISTORY_DOMAIN: {
      const domain = action.get('domain')

      if (!domain) {
        break
      }

      historyState.getSites(state).forEach(historySite => {
        if (urlParse(historySite.get('location')).hostname === domain) {
          state = historyState.removeSite(state, historySite.get('key'))
        }
      })

      state = aboutHistoryState.setHistory(state, historyState.getSites(state))

      break
    }

    case appConstants.APP_POPULATE_HISTORY:
      {
        state = aboutHistoryState.setHistory(state, historyState.getSites(state))
        break
      }

    case appConstants.APP_ON_HISTORY_LIMIT:
      {
        const historyLimit = getSetting(settings.AUTOCOMPLETE_HISTORY_SIZE)
        let historySites = historyState.getSites(state)

        if (historySites.size > historyLimit) {
          historySites = historySites
            .sort((site1, site2) => (site2.get('lastAccessedTime') || 0) - (site1.get('lastAccessedTime') || 0))
            .take(historyLimit)

          state = state.set(STATE_SITES.HISTORY_SITES, historySites)
          calculateTopSites(true)
          state = aboutHistoryState.setHistory(state, historySites)
        }
      }
  }

  return state
}

module.exports = historyReducer
