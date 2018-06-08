/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const suffix = '#brave-favicon-fragment'

module.exports = {
  wrapFaviconUrl: (url) => url && `${url}${suffix}`,
  unwrapFaviconUrl: (url) => url && url.substring(0, url.length - suffix.length),
  isWrappedFaviconUrl: (url) => !!(url && url.endsWith(suffix))
}
