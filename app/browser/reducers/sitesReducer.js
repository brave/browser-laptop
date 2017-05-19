/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const filtering = require('../../filtering')
const siteCache = require('../../common/state/siteCache')
const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const syncActions = require('../../../js/actions/syncActions')
const syncUtil = require('../../../js/state/syncUtil')
const Immutable = require('immutable')
const settings = require('../../../js/constants/settings')
const {getSetting} = require('../../../js/settings')
const writeActions = require('../../../js/constants/sync/proto').actions
const tabState = require('../../common/state/tabState')

const syncEnabled = () => {
  return getSetting(settings.SYNC_ENABLED) === true
}

const updateActiveTabBookmarked = (state) => {
  const tab = tabState.getActiveTab(state)
  if (!tab) {
    return state
  }
  const bookmarked = siteUtil.isLocationBookmarked(state, tab.get('url'))
  return tabState.updateTabValue(state, tab.set('bookmarked', bookmarked))
}

const sitesReducer = (state, action, immutableAction) => {
  switch (action.actionType) {
    case appConstants.APP_SET_STATE:
      state = siteCache.loadLocationSiteKeysCache(state)
      break
    case appConstants.APP_ON_CLEAR_BROWSING_DATA:
      if (immutableAction.getIn(['clearDataDetail', 'browserHistory'])) {
        state = state.set('sites', siteUtil.clearHistory(state.get('sites')))
        filtering.clearHistory()
      }
      break
    case appConstants.APP_ADD_SITE:
      if (Immutable.List.isList(action.siteDetail)) {
        action.siteDetail.forEach((s) => {
          state = siteUtil.addSite(state, s, action.tag, undefined, action.skipSync)
        })
      } else {
        let sites = state.get('sites')
        if (!action.siteDetail.get('folderId') && siteUtil.isFolder(action.siteDetail)) {
          action.siteDetail = action.siteDetail.set('folderId', siteUtil.getNextFolderId(sites))
        }
        state = siteUtil.addSite(state, action.siteDetail, action.tag, action.originalSiteDetail, action.skipSync)
      }
      if (action.destinationDetail) {
        const sourceKey = siteUtil.getSiteKey(action.siteDetail)
        const destinationKey = siteUtil.getSiteKey(action.destinationDetail)

        if (sourceKey != null) {
          state = siteUtil.moveSite(state,
            sourceKey, destinationKey, false, false, true)
        }
      }
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, action.destinationDetail || action.siteDetail)
      }
      state = updateActiveTabBookmarked(state)
      break
    case appConstants.APP_REMOVE_SITE:
      const removeSiteSyncCallback = action.skipSync ? undefined : syncActions.removeSite
      state = siteUtil.removeSite(state, action.siteDetail, action.tag, true, removeSiteSyncCallback)
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, action.siteDetail)
      }
      state = updateActiveTabBookmarked(state)
      break
    case appConstants.APP_MOVE_SITE:
      state = siteUtil.moveSite(state,
        action.sourceKey, action.destinationKey, action.prepend,
        action.destinationIsParent, false)
      if (syncEnabled()) {
        const destinationDetail = state.getIn(['sites', action.destinationKey])
        state = syncUtil.updateSiteCache(state, destinationDetail)
      }
      break
    case appConstants.APP_APPLY_SITE_RECORDS:
      let nextFolderId = siteUtil.getNextFolderId(state.get('sites'))
      // Ensure that all folders are assigned folderIds
      action.records.forEach((record, i) => {
        if (record.action !== writeActions.DELETE &&
          record.bookmark && record.bookmark.isFolder &&
          record.bookmark.site &&
          typeof record.bookmark.site.folderId !== 'number') {
          record.bookmark.site.folderId = nextFolderId
          action.records.set(i, record)
          nextFolderId = nextFolderId + 1
        }
      })
      action.records.forEach((record) => {
        const siteData = syncUtil.getSiteDataFromRecord(record, state, action.records)
        const tag = siteData.tag
        let siteDetail = siteData.siteDetail
        switch (record.action) {
          case writeActions.CREATE:
            state = siteUtil.addSite(state, siteDetail, tag, undefined, true)
            break
          case writeActions.UPDATE:
            state = siteUtil.addSite(state, siteDetail, tag, siteData.existingObjectData, true)
            break
          case writeActions.DELETE:
            state = siteUtil.removeSite(state, siteDetail, tag)
            break
        }
        state = syncUtil.updateSiteCache(state, siteDetail)
      })
      break
    case appConstants.APP_TAB_UPDATED:
      if (immutableAction.getIn(['changeInfo', 'pinned']) != null) {
        const pinned = immutableAction.getIn(['changeInfo', 'pinned'])
        const tabId = immutableAction.getIn(['tabValue', 'tabId'])
        const tab = state.get('tabs').find((tab) => tab.get('tabId') === tabId)
        if (!tab) {
          console.warn('Trying to pin a tabId which does not exist:', tabId, 'tabs: ', state.get('tabs').toJS())
          break
        }
        const sites = state.get('sites')
        const siteDetail = siteUtil.getDetailFromTab(tab, siteTags.PINNED, sites)
        if (pinned) {
          state = siteUtil.addSite(state, siteDetail, siteTags.PINNED)
        } else {
          state = siteUtil.removeSite(state, siteDetail, siteTags.PINNED)
        }
        if (syncEnabled()) {
          state = syncUtil.updateSiteCache(state, siteDetail)
        }
      }
      break
    case appConstants.APP_CREATE_TAB_REQUESTED: {
      const createProperties = immutableAction.get('createProperties')
      if (createProperties.get('pinned')) {
        state = siteUtil.addSite(state,
          siteUtil.getDetailFromCreateProperties(createProperties), siteTags.PINNED)
      }
      break
    }
  }
  return state
}

module.exports = sitesReducer
