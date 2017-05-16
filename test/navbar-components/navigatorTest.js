/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, braveMenu, braveryPanel, braveryPanelContainer} = require('../lib/selectors')

describe('navigator component tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('lion badge', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('is grayed out if shield is disabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl('https://clifton.io/')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount('[data-test2-id="shield-down-false"]', 1)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForElementCount('[data-test-id="shields-toggle"][data-switch-status="true"]', 1)
        .click('[data-test-id="shields-toggle"] .switchBackground')
        .waitForElementCount('[data-test-id="shields-toggle"][data-switch-status="false"]', 1)
        .click(braveryPanelContainer)
        .waitForElementCount('[data-test2-id="shield-down-true"]', 1)
    })
  })
})
