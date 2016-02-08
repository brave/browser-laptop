/* global describe, it, before */

const Brave = require('./lib/brave')
const appConfig = require('../js/constants/appConfig')
const settings = require('../js/constants/settings')
const {urlInput, newFrameButton, tabPage, tabPage1, tabPage2, closeTab, activeWebview} = require('./lib/selectors')
const assert = require('assert')

describe('tab pages', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('basic tab page functionality', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('creates a new tab page when full', function * () {
      yield this.app.client.elements(tabPage, function (e, res) {
        assert.equal(0, res.value.length)
      })

      for (let i = 0; i < appConfig.defaultSettings[settings.TABS_PER_TAB_PAGE]; i++) {
        yield this.app.client.click(newFrameButton)
      }

      yield this.app.client.elements(tabPage, function (e, res) {
        assert.equal(2, res.value.length)
      })
    })

    it('removes a new tab page when closing excess tabs', function * () {
      yield this.app.client.click(closeTab)
        .elements(tabPage, function (e, res) {
          assert.equal(0, res.value.length)
        })
    })

    it('can change active tab pages', function *() {
      yield this.app.client.click(newFrameButton)
        .click(tabPage1)
        .waitForExist(tabPage1 + '.active')
    })

    it('clicking on webview resets tab page selection', function * () {
      yield this.app.client.click(newFrameButton)
        .click(activeWebview)
        .waitForExist(tabPage2 + '.active')
    })
  })
})

