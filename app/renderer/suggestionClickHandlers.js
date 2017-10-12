/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const appActions = require('../../js/actions/appActions')
const windowActions = require('../../js/actions/windowActions')
const windowStore = require('../../js/stores/windowStore')
const appStoreRenderer = require('../../js/stores/appStoreRenderer')
const suggestionTypes = require('../../js/constants/suggestionTypes')
const {makeImmutable} = require('../common/state/immutableUtil')
const {getActiveFrame} = require('../../js/state/frameStateUtil')

const navigateSiteClickHandler = (suggestionData, isForSecondaryAction, shiftKey) => {
  // When clicked make sure to hide autocomplete
  windowActions.setRenderUrlBarSuggestions(false)

  suggestionData = makeImmutable(suggestionData)
  const type = suggestionData.get('type')
  let partitionNumber
  let url
  if (type === suggestionTypes.SEARCH) {
    const frameSearchDetail = suggestionData.getIn(['navbar', 'urlbar', 'searchDetail'])
    const searchDetail = appStoreRenderer.state.get('searchDetail')
    let searchURL = frameSearchDetail
      ? frameSearchDetail.get('search') : searchDetail.get('searchURL')
    url = searchURL.replace('{searchTerms}', encodeURIComponent(suggestionData.get('location')))
  } else if (type === suggestionTypes.TAB) {
    appActions.tabActivateRequested(suggestionData.get('tabId'))
    return
  } else if (type === suggestionTypes.TOP_SITE) {
    url = suggestionData.get('location')
  } else {
    url = suggestionData.get('location')
    partitionNumber = (suggestionData && suggestionData.get && suggestionData.get('partitionNumber')) || undefined
  }

  if (isForSecondaryAction) {
    appActions.createTabRequested({
      url,
      partitionNumber,
      active: !!shiftKey
    })
  } else {
    const activeFrame = getActiveFrame(windowStore.state)
    appActions.loadURLRequested(activeFrame.get('tabId'), url)
    windowActions.setUrlBarActive(false)
  }
}

module.exports = {
  navigateSiteClickHandler
}
