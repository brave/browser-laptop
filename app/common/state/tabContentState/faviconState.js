/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Utils
const {isTargetAboutUrl} = require('../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {isEntryIntersected} = require('../../../../app/renderer/lib/observerUtil')

// Styles
const {intersection} = require('../../../renderer/components/styles/global')

module.exports.showFavicon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  const isNewTabPage = frameStateUtil.frameLocationMatch(frame, 'about:newtab')

  if (isEntryIntersected(state, 'tabs', intersection.at40)) {
    // do not show it at all at minimum ratio (intersection.at12)
    if (isEntryIntersected(state, 'tabs', intersection.at12)) {
      return false
    }

    return (
      // when almost all tab content is covered,
      // only show favicon if there's no closeIcon (intersection.at20)
      // or otherwise only for the non-active tab
      isEntryIntersected(state, 'tabs', intersection.at20) ||
      !frameStateUtil.isFrameKeyActive(state, frameKey)
    )
  }

  // new tab page is the only tab we do not show favicon
  // unless we are loading the next page
  return !isNewTabPage || module.exports.showLoadingIcon(state, frameKey)
}

module.exports.getFavicon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)
  const isLoadingVisible = module.exports.showLoadingIcon(state, frameKey)

  if (frame == null) {
    return ''
  }

  return !isLoadingVisible && frame.get('icon')
}

module.exports.showLoadingIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }
  const isLoading = frame.get('loading')
  // handle false or falsy value
  if (!isLoading) {
    return false
  }

  const isLoadingAboutUrl = isTargetAboutUrl(frame.get('provisionalLocation'))
  return !isLoadingAboutUrl
}

module.exports.showIconWithLessMargin = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return isEntryIntersected(state, 'tabs', intersection.at30)
}

module.exports.showFaviconAtReducedSize = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return isEntryIntersected(state, 'tabs', intersection.at20)
}
