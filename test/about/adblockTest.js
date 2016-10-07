/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

describe('about:adblock', function () {
  Brave.beforeAll(this)
  before(function * () {
    const url = getTargetAboutUrl('about:adblock')
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .waitForExist('.tab[data-frame-key="1"]')
      .tabByIndex(0)
      .loadUrl(url)
  })

  it('lists adblock count', function * () {
    yield this.app.client
      .getText('.blockedCountTotal').should.eventually.be.equal('0')
  })
})
