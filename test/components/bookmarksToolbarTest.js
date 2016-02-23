/* global describe, it, before */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const {urlInput} = require('../lib/selectors')

describe('bookmarksToolbar', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('toolbar signal', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it.skip('should open toolbar when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHOW_BOOKMARKS_TOOLBAR)
        .waitForExist('.bookmarksToolbar')
    })

    it.skip('should close toolbar when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHOW_BOOKMARKS_TOOLBAR)
        .ipcSend(messages.HIDE_BOOKMARKS_TOOLBAR)
        .isExisting('.bookmarksToolbar').should.eventually.be.false
    })
  })
})
