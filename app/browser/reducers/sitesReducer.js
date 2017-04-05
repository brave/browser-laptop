/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appConstants = require('../../../js/constants/appConstants')
const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const syncActions = require('../../../js/actions/syncActions')
const syncUtil = require('../../../js/state/syncUtil')
const Immutable = require('immutable')
const {makeImmutable} = require('../../common/state/immutableUtil')
const settings = require('../../../js/constants/settings')
const {getSetting} = require('../../../js/settings')

const syncEnabled = () => {
  return getSetting(settings.SYNC_ENABLED) === true
}

const sitesReducer = (state, action, emitChanges) => {
  switch (action.actionType) {
    case appConstants.APP_ADD_SITE:
      const addSiteSyncCallback = action.skipSync ? undefined : syncActions.updateSite
      if (action.siteDetail.constructor === Immutable.List) {
        action.siteDetail.forEach((s) => {
          state = state.set('sites', siteUtil.addSite(state.get('sites'), s, action.tag, undefined, addSiteSyncCallback))
        })
      } else {
        let sites = state.get('sites')
        if (!action.siteDetail.get('folderId') && siteUtil.isFolder(action.siteDetail)) {
          action.siteDetail = action.siteDetail.set('folderId', siteUtil.getNextFolderId(sites))
        }
        state = state.set('sites', siteUtil.addSite(sites, action.siteDetail, action.tag, action.originalSiteDetail, addSiteSyncCallback))
      }
      if (action.destinationDetail) {
        state = state.set('sites', siteUtil.moveSite(state.get('sites'),
          action.siteDetail, action.destinationDetail, false, false, true))
      }
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, action.destinationDetail || action.siteDetail)
      }
      break
    case appConstants.APP_REMOVE_SITE:
      const removeSiteSyncCallback = action.skipSync ? undefined : syncActions.removeSite
      state = state.set('sites', siteUtil.removeSite(state.get('sites'), action.siteDetail, action.tag, true, removeSiteSyncCallback))
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, action.siteDetail)
      }
      break
    case appConstants.APP_MOVE_SITE:
      state = state.set('sites', siteUtil.moveSite(state.get('sites'),
        action.sourceDetail, action.destinationDetail, action.prepend,
        action.destinationIsParent, false, syncActions.updateSite))
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, action.destinationDetail)
      }
      break
    case appConstants.APP_TAB_PINNED:
      const tab = state.get('tabs').find((tab) => tab.get('tabId') === action.tabId)
      if (!tab) {
        console.warn('Trying to pin a tabId which does not exist:', action.tabId, 'tabs: ', state.get('tabs').toJS())
        break
      }
      const siteDetail = siteUtil.getDetailFromTab(tab, siteTags.PINNED)
      if (action.pinned) {
        state = state.set('sites', siteUtil.addSite(state.get('sites'), siteDetail, siteTags.PINNED))
      } else {
        state = state.set('sites', siteUtil.removeSite(state.get('sites'), siteDetail, siteTags.PINNED))
      }
      if (syncEnabled()) {
        state = syncUtil.updateSiteCache(state, siteDetail)
      }
      break

    case appConstants.APP_MAYBE_CREATE_TAB_REQUESTED:
    case appConstants.APP_CREATE_TAB_REQUESTED: {
      action = makeImmutable(action)
      const createProperties = action.get('createProperties')
      if (createProperties.get('pinned')) {
        state = state.set('sites', siteUtil.addSite(state.get('sites'),
          siteUtil.getDetailFromCreateProperties(createProperties), siteTags.PINNED))
      }
      break
    }
  }
  return state
}

module.exports = sitesReducer
