/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')

describe('urlBar', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForEnabled(urlInput)
  }

  describe('autocomplete', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })
      yield this.app.client
        .addSite({ location: 'https://brave.com', title: 'Brave' })
        .addSite({ location: 'https://brave.com/test' })
        .addSite({ location: 'https://www.youtube.com' })
    })

    it('autocompletes without protocol', function * () {
      // now type something
      yield this.app.client
        .keys('br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'brave.com')
        })
    })

    it('autocompletes with protocol', function * () {
      // now type something
      yield this.app.client
        .keys('https://br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
    })

    it('autocompletes without www.', function * () {
      // now type something
      yield this.app.client
        .keys('you')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'youtube.com')
        })
    })

    it('autofills from selected suggestion', function * () {
      // now type something
      yield this.app.client
        .keys('https://br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
        // hit down
        .keys('\uE015')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com/test')
        })
        // hit up
        .keys('\uE013')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
    })
  })
})
