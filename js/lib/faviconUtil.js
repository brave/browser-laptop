import { isSourceAboutUrl } from './appUrlUtil.js'
const UrlUtil = require('../../node_modules/urlutil.js/dist/node-urlutil.js')

module.exports = function getFavicon (frameProps) {
  if (!frameProps.get('location')) {
    return null
  }

  var size = window.devicePixelRatio * 16
  var resolution = '#-moz-resolution=' + size + ',' + size
  var iconHref = frameProps.get('icon')

  // Default to favicon.ico if we can't find an icon.
  if (!iconHref) {
    var loc = frameProps.get('location')
    if (UrlUtil.isViewSourceUrl(loc)) {
      loc = loc.substring('view-source:'.length)
    } else if (UrlUtil.isImageDataUrl(loc)) {
      return loc
    } else if (isSourceAboutUrl(loc) || UrlUtil.isDataUrl(loc)) {
      return ''
    }

    try {
      var defaultIcon = new window.URL('/favicon.ico' + resolution, loc)
      iconHref = defaultIcon.toString()
    } catch (e) {
      return ''
    }
  }
  return iconHref + resolution
}
