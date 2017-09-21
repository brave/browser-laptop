/* global describe, it, before */

const Brave = require('../lib/brave')

const testUrl = 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/muon-tests.html'

function * setup (client) {
  yield client.waitForUrl(Brave.newTabUrl).waitForBrowserWindow()
}

describe('muon tests', function () {
  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
    yield this.app.client
      .tabByIndex(0)
      .url(testUrl)
  })
  it('muon.url.parse', function * () {
    yield this.app.client
      .waitForTextValue('#urlParseSimple', 'success')
      .waitForTextValue('#urlParseComplex', 'success')
      .waitForTextValue('#urlParseIssue10270', 'success')
  })
  it('urlUtil.getOrigin', function * () {
    yield this.app.client
      .waitForTextValue('#getOriginSimple', 'success')
      .waitForTextValue('#getOriginFile', 'success')
      .waitForTextValue('#getOriginWithPort', 'success')
      .waitForTextValue('#getOriginIP', 'success')
      .waitForTextValue('#getOriginAbout', 'success')
      .waitForTextValue('#getOriginNull', 'success')
      .waitForTextValue('#getOriginInvalid', 'success')
  })
  it('suggestion', function * () {
    yield this.app.client
      .waitForTextValue('#suggestionSimpleCheck', 'success')
  })
})
