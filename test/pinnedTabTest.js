/* global describe, it, before */

const Brave = require('./lib/brave')

const messages = require('../js/constants/messages')
const {urlInput} = require('./lib/selectors')

describe('pinnedTabs', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('new tab signal', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it('creates a new pinned tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPinned: true })
        .waitForExist('.tab.isPinned[data-frame-key="2"]')
    })
  })
})
