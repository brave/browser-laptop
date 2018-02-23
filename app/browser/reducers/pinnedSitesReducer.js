/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// State
const pinnedSitesState = require('../../common/state/pinnedSitesState')
const tabState = require('../../common/state/tabState')

// Constants
const appConstants = require('../../../js/constants/appConstants')
const {STATE_SITES} = require('../../../js/constants/stateConstants')

// Utils
const {makeImmutable} = require('../../common/state/immutableUtil')
const syncUtil = require('../../../js/state/syncUtil')
const pinnedSitesUtil = require('../../common/lib/pinnedSitesUtil')
const {shouldDebugTabEvents} = require('../../cmdLine')

const pinnedSitesReducer = (state, action, immutableAction) => {
  action = immutableAction || makeImmutable(action)
  switch (action.get('actionType')) {
    case appConstants.APP_TAB_UPDATED:
      {
        const tabId = action.getIn(['tabValue', 'tabId'])
        // has this tab just been pinned or un-pinned?
        if (action.getIn(['changeInfo', 'pinned']) != null) {
          const pinned = action.getIn(['changeInfo', 'pinned'])
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
          state = syncUtil.updateObjectCache(state, siteDetail, STATE_SITES.PINNED_SITES)
        } else if (action.getIn(['changeInfo', 'index']) != null && tabState.isTabPinned(state, tabId)) {
          // The tab index changed and tab is already pinned.
          // We cannot rely on the index reported by muon as pinned tabs may not always start at 0,
          // and each window may have a different index for each pinned tab,
          // but we want the 'order' in pinnedSites to be sequential starting at 0.
          // So, focus on the order of the tabs, and make our own index.
          const windowId = tabState.getWindowId(state, tabId)
          if (windowId == null || windowId === -1) {
            break
          }
          let windowPinnedTabs = tabState.getPinnedTabsByWindowId(state, windowId)
          if (!windowPinnedTabs) {
            break
          }
          windowPinnedTabs = windowPinnedTabs.sort((a, b) => a.get('index') - b.get('index'))
          const tab = tabState.getByTabId(state, tabId)
          const windowPinnedTabIndex = windowPinnedTabs.findIndex(pinnedTab => pinnedTab === tab)
          if (windowPinnedTabIndex === -1) {
            console.error(`pinnedSitesReducer:APP_TAB_UPDATED: could not find tab ${tabId} as a pinned tab in tabState!`)
          }
          const siteKey = pinnedSitesUtil.getKey(pinnedSitesUtil.getDetailsFromTab(pinnedSitesState.getSites(state), tab))
          // update state for new order so pinned tabs order is persisted on restart
          if (shouldDebugTabEvents) {
            console.log(`Moving pinned site '${siteKey}' to order: ${windowPinnedTabIndex}`)
          }
          const newState = pinnedSitesState.moveSiteToNewOrder(state, siteKey, windowPinnedTabIndex, shouldDebugTabEvents)
          // did anything change?
          if (newState !== state) {
            state = newState
            // make sure it's synced
            const newSite = pinnedSitesState.getSite(state, siteKey)
            state = syncUtil.updateObjectCache(state, newSite, STATE_SITES.PINNED_SITES)
          }
        }
        break
      }
    case appConstants.APP_CREATE_TAB_REQUESTED:
      {
        const createProperties = action.get('createProperties', Immutable.Map())
        if (createProperties.get('pinned')) {
          state = pinnedSitesState.addPinnedSite(state, pinnedSitesUtil.getDetailFromProperties(createProperties))
        }
        break
      }
  }

  return state
}

module.exports = pinnedSitesReducer
