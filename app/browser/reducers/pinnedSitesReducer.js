/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State
const pinnedSitesState = require('../../common/state/pinnedSitesState')
const tabState = require('../../common/state/tabState')

// Constants
const appConstants = require('../../../js/constants/appConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const pinnedSitesUtil = require('../../common/lib/pinnedSitesUtil')

const pinnedSitesReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_TAB_UPDATED:
      {
        if (action.getIn(['changeInfo', 'pinned']) != null) {
          const pinned = action.getIn(['changeInfo', 'pinned'])
          const tabId = action.getIn(['tabValue', 'tabId'])
          const tab = tabState.getByTabId(state, tabId)
          if (!tab) {
            console.warn('Trying to pin a tabId which does not exist:', tabId, 'tabs: ', state.get('tabs').toJS())
            break
          }
          const sites = pinnedSitesState.getSites(state)
          const siteDetail = pinnedSitesUtil.getDetailsFromTab(sites, tab)
          if (pinned) {
            state = pinnedSitesState.addPinnedSite(state, siteDetail)
          } else {
            state = pinnedSitesState.removePinnedSite(state, siteDetail)
          }
          if (syncUtil.syncEnabled()) {
            state = syncUtil.updateSiteCache(state, siteDetail)
          }
        }
        break
      }
    case appConstants.APP_CREATE_TAB_REQUESTED:
      {
        const createProperties = action.get('createProperties')
        if (createProperties.get('pinned')) {
          state = pinnedSitesState.addPinnedSite(state, pinnedSitesUtil.getDetailFromProperties(createProperties))
        }
        break
      }
    case appConstants.APP_ON_PINNED_TAB_REORDER:
      {
        state = pinnedSitesState.reOrderSite(
          state,
          action.siteKey,
          action.destinationKey,
          action.prepend
        )

        // TODO do we need this for pinned sites?
        if (syncUtil.syncEnabled()) {
          const newSite = state.getIn(['pinnedSites', action.siteKey])
          state = syncUtil.updateSiteCache(state, newSite)
        }
        break
      }
  }

  return state
}

module.exports = pinnedSitesReducer
