/* global describe, it, before */

const Brave = require('../lib/brave')
const settings = require('../../js/constants/settings')
const {
  urlInput,
  activeTabTitle
} = require('../lib/selectors')

const torCheckUrl = 'https://check.torproject.org/'

describe('tor tab tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  const verifyTorRunning = function (status) {
    const prefix = status ? 'Congratulations' : 'Sorry'
    return this.getText(activeTabTitle).then((title) => {
      if (title instanceof Array) {
        title = title.pop()
      }
      return title.startsWith(prefix)
    })
  }

  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
  })

  it('uses ddg if setting is on', function * () {
    yield this.app.client.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR, true)
    yield this.app.client
      .newTab({ isPrivate: true, isTor: true })
      .pause(10000) // wait for tor init
      .setValue(urlInput, 'zzz')
      .keys(Brave.keys.ENTER)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForInputText(urlInput, /duckduckgo/)
  })
  it('does not use ddg if setting is off', function * () {
    yield this.app.client.changeSetting(settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR, false)
    yield this.app.client
      .newTab({ isPrivate: true, isTor: true })
      .setValue(urlInput, 'test')
      .keys(Brave.keys.ENTER)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForInputText(urlInput, /google/)
  })
  it('uses tor when tor is enabled', function * () {
    yield this.app.client
      .newTab({ url: torCheckUrl, isPrivate: true, isTor: true })
      .waitForUrl(torCheckUrl, 10000)
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(verifyTorRunning.bind(this.app.client, true))
  })
  it('does not use tor if setting is off', function * () {
    yield this.app.client
      .newTab({ url: torCheckUrl, isPrivate: true })
      .waitForUrl(torCheckUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(verifyTorRunning.bind(this.app.client, false))
  })
})
