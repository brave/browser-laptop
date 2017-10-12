/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const { hamburgerMenu, tabsToolbar, contextMenu } = require('../lib/selectors')

describe('tabs toolbar tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(tabsToolbar)
  }

  describe('hamburgerMenu\'s contextMenu appearance test', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    beforeEach(function * () {
      yield this.app.client
        .click(tabsToolbar)
    })

    it('shows when clicked', function * () {
      yield this.app.client
        .click(hamburgerMenu)
        .waitForExist(contextMenu)
    })

    it('disappears when clicked twice', function * () {
      yield this.app.client
        .click(hamburgerMenu)
        .waitForExist(contextMenu)
        .click(hamburgerMenu)
        .waitForElementCount(contextMenu, 0)
        .then(() => true)
    })

    it('reappears when clicked again', function * () {
      yield this.app.client
        .click(hamburgerMenu)
        .waitForExist(contextMenu)
        .click(tabsToolbar)
        .waitForElementCount(contextMenu, 0)
        .click(hamburgerMenu)
        .waitForExist(contextMenu)
    })
  })
})
