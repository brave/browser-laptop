/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { isSourceAboutUrl } = require('./appUrlUtil')
const UrlUtil = require('./urlutil')

module.exports = function getFavicon (frameProps, iconHref) {
  return new Promise((resolve, reject) => {
    if (!frameProps.get('location')) {
      resolve(null)
    }

    const cachedFavicon = frameProps.get('icon')
    if (cachedFavicon && frameProps.get('iconUrl') === iconHref) {
      return resolve(cachedFavicon)
    }

    const size = window.devicePixelRatio * 16
    const resolution = '#-moz-resolution=' + size + ',' + size

    // Default to favicon.ico if we can't find an icon.
    if (!iconHref) {
      let loc = frameProps.get('location')
      if (UrlUtil.isViewSourceUrl(loc)) {
        loc = loc.substring('view-source:'.length)
      } else if (UrlUtil.isImageDataUrl(loc)) {
        resolve(loc)
      } else if (isSourceAboutUrl(loc) || UrlUtil.isDataUrl(loc)) {
        resolve('')
      }

      try {
        const defaultIcon = new window.URL('/favicon.ico' + resolution, loc)
        iconHref = defaultIcon.toString()
      } catch (e) {
        resolve('')
      }
    }

    if (UrlUtil.isImageDataUrl(iconHref)) {
      resolve(iconHref)
    } else {
      const img = new window.Image()
      img.onload = () => {
        let canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/x-icon'))
      }
      img.src = iconHref + resolution
    }
  })
}
