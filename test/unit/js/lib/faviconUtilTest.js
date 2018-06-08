/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const faviconUtil = require('../../../../js/lib/faviconUtil')
const assert = require('assert')

require('../../braveUnit')

describe('faviconUtil', function () {
  it('wraps, identifies and unwraps URLs', function () {
    const url = 'http://webserver.com/favicon.ico'
    const wrappedUrl = faviconUtil.wrapFaviconUrl(url)
    const unwrappedUrl = faviconUtil.unwrapFaviconUrl(wrappedUrl)

    assert.equal(faviconUtil.isWrappedFaviconUrl(url), false)
    assert.equal(faviconUtil.isWrappedFaviconUrl(wrappedUrl), true)
    assert.equal(faviconUtil.isWrappedFaviconUrl(unwrappedUrl), false)
    assert.equal(url, unwrappedUrl)
  })
  it('wraps, identifies and unwraps URLs with query params', function () {
    const url = 'http://webserver.com/favicon.ico?qp=1&qp2=2'
    const wrappedUrl = faviconUtil.wrapFaviconUrl(url)
    const unwrappedUrl = faviconUtil.unwrapFaviconUrl(wrappedUrl)

    assert.equal(faviconUtil.isWrappedFaviconUrl(url), false)
    assert.equal(faviconUtil.isWrappedFaviconUrl(wrappedUrl), true)
    assert.equal(faviconUtil.isWrappedFaviconUrl(unwrappedUrl), false)
    assert.equal(url, unwrappedUrl)
  })
  it('works with undefined', function () {
    const url = undefined
    const wrappedUrl = faviconUtil.wrapFaviconUrl(url)
    const unwrappedUrl = faviconUtil.unwrapFaviconUrl(wrappedUrl)

    assert.equal(faviconUtil.isWrappedFaviconUrl(url), false)
    assert.equal(wrappedUrl, undefined)
    assert.equal(unwrappedUrl, undefined)
  })
})
