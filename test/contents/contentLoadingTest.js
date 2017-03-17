/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')

describe('content loading', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
  })

  it('does not allow local files to load other other files', function * () {
    var page1 = Brave.fixtureUrl('localFileAccess.html')
    yield this.app.client
      .tabByIndex(0)
      .url(page1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getText('[data-test-id="tabTitle"]').then((title) => {
          return title === 'failed'
        })
      })
  })

  it('does not support battery status API', function * () {
    var page1 = Brave.fixtureUrl('battery.html')
    yield this.app.client
      .tabByIndex(0)
      .url(page1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getText('[data-test-id="tabTitle"]').then((title) => {
          return title === 'fail'
        })
      })
  })
})
