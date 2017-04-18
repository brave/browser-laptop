/* global describe, it, before */

const Brave = require('../lib/brave')
const selectors = require('../lib/selectors')
const messages = require('../../js/constants/messages')

describe('adBlock', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(selectors.urlInput)
  }

  describe('blocks ruled ads', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it('blocks a known rule on a local url', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.newsbtc.com/2016/02/14/bitcoin-price-weekly-analysis-primed-for-lift-off-2/')
        .isExisting('.adfixedLeft').should.eventually.be.false
    })
  })
})
