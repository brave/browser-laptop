/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isSourceAboutUrl } from './appUrlUtil.js'
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')

module.exports = function getFavicon (frameProps) {
  if (!frameProps.get('location')) {
    return null
  }

  const size = window.devicePixelRatio * 16
  const resolution = '#-moz-resolution=' + size + ',' + size
  let iconHref = frameProps.get('icon')

  // Default to favicon.ico if we can't find an icon.
  if (!iconHref) {
    let loc = frameProps.get('location')
    if (UrlUtil.isViewSourceUrl(loc)) {
      loc = loc.substring('view-source:'.length)
    } else if (UrlUtil.isImageDataUrl(loc)) {
      return loc
    } else if (isSourceAboutUrl(loc) || UrlUtil.isDataUrl(loc)) {
      return ''
    }

    try {
      const defaultIcon = new window.URL('/favicon.ico' + resolution, loc)
      iconHref = defaultIcon.toString()
    } catch (e) {
      return ''
    }
  }
  return iconHref + resolution
}
