/* global describe, it, before */

const Brave = require('./lib/brave')
const Config = require('../js/constants/config').default

describe('urlbar', function () {
  const urlInput = '#urlInput'

  function setup (client) {
    return client
      .waitUntilWindowLoaded()
      .waitForVisible('#browser')
      .waitForVisible(urlInput)
      .waitForValue(urlInput, Config.defaultUrl)
  }

  function hasFocus (client) {
    return client.getAttribute(':focus', 'id').should.eventually.be.equal('urlInput')
  }

  function defaultUrl (client) {
    return client.getValue(urlInput).should.eventually.be.equal(Config.defaultUrl)
  }

  function selectsText (client) {
    return client.getSelectedText().should.eventually.be.equal(Config.defaultUrl)
  }

  describe('new window', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('displays the default url', function *() {
      yield defaultUrl(this.app.client)
    })

    it('has focus', function *() {
      yield hasFocus(this.app.client)
    })

    it('selects the text', function *() {
      yield selectsText(this.app.client)
    })
  })

  describe('typing', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('clears the selected text on keypress', function *() {
      yield this.app.client
        .keys('a')
        .getValue(urlInput).should.eventually.be.equal('a')
        .getSelectedText().should.be.eventually.be.equal('')
    })

    it('reverts typing on escape', function *() {
      yield this.app.client
        .ipcSend('shortcut-active-frame-stop')
        .getValue(urlInput).should.eventually.be.equal(Config.defaultUrl)
        .getSelectedText().should.eventually.be.equal(Config.defaultUrl)
    })
  })

  describe('new tab', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client).ipcSend('shortcut-new-frame')
    })

    it('displays the default url', function *() {
      yield defaultUrl(this.app.client)
    })

    it('has focus', function *() {
      yield hasFocus(this.app.client)
    })

    it('selects the text', function *() {
      yield selectsText(this.app.client)
    })
  })

  describe('change tabs', function () {
    // different states - focused, selected, typing
    // including awesome bar state

  })

  describe('shortcut-focus-url', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
        .keys('\uE007') // clear focus
        .waitForVisible(urlInput)
        // need a check here to verify that focus is gone
        .ipcSend('shortcut-focus-url')
        .waitForVisible(urlInput)
    })

    it('displays the default url', function *() {
      yield defaultUrl(this.app.client)
    })

    it('has focus', function *() {
      yield hasFocus(this.app.client)
    })

    it('selects the text', function *() {
      yield selectsText(this.app.client)
    })
  })
})
