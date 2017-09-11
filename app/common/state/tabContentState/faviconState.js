/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Utils
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {isEntryIntersected} = require('../../../../app/renderer/lib/observerUtil')

// TODO deprecate
const {braveExtensionId} = require('../../../../js/constants/config')

// Styles
const {intersection} = require('../../../renderer/components/styles/global')

// TODO deprecate
module.exports.deprecatedIsTabLoading = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    frame.get('loading') ||
    frame.get('location') === 'about:blank'
  ) &&
  (
    !frame.get('provisionalLocation') ||
    !frame.get('provisionalLocation').startsWith(`chrome-extension://${braveExtensionId}/`)
  )
}

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
  return !isNewTabPage
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

  if (frame.get('loading') == null) {
    return false
  }

  return (
    !isSourceAboutUrl(frame.get('location')) &&
    frame.get('loading')
  )
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
