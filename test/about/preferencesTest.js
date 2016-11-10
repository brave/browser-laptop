/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, homepageInput} = require('../lib/selectors')

const prefsUrl = 'about:preferences'

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

describe('General Panel', function () {
  describe('homepage', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it.skip('homepage displays punycode', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(homepageInput)
        .click(homepageInput)
        .keys('а')
        .waitUntil(function () {
          return this.getValue(homepageInput).then((val) => {
            return val === 'https://www.brave.xn--com-7cd'
          })
        })
    })
  })
})
