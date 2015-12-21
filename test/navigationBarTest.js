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

  function blur (client, text = Config.defaultUrl) {
    return client
      .keys('\uE007') // clear focus
      .waitForVisible(urlInput)
  }

  function blurred (client, text = Config.defaultUrl) {
    return client
      .getValue(urlInput).should.eventually.be.equal(text)
      .getSelectedText().should.eventually.be.equal('')
        // TODO: no focus test
  }

  function hasFocus (client) {
    return client.getAttribute(':focus', 'id').should.eventually.be.equal('urlInput')
  }

  function defaultUrl (client) {
    return client.getValue(urlInput).should.eventually.be.equal(Config.defaultUrl)
  }

  function selectsText (client, text = Config.defaultUrl) {
    return client.getSelectedText().should.eventually.be.equal(text)
  }

  function newFrame (client) {
    return client.ipcSend('shortcut-new-frame')
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

  describe('new tab', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      yield newFrame(this.app.client)
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
      yield this.app.client.keys('a')
    })

    it('sets the value', function *() {
      yield this.app.client.getValue(urlInput).should.eventually.be.equal('a')
    })

    it('clears the selected text', function *() {
      yield selectsText(this.app.client, '')
    })

    describe('escape', function *() {
      before(function *() {
        yield this.app.client.ipcSend('shortcut-active-frame-stop')
      })

      it('reverts typing on escape', function *() {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(Config.defaultUrl)
        yield selectsText(this.app.client)
      })
    })
  })

  // need to move urlbar state to frame before enabling these
  describe('change tabs', function () {
    Brave.beforeAll(this)

    describe('default state tab', function () {
      before(function *() {
        yield newFrame(this.app.client)
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

    describe('blurred tab', function () {
      before(function *() {
        yield setup(this.app.client)
        yield blur(this.app.client)
      })

      it('blurs the urlInput', function *() {
        yield blurred(this.app.client)
      })
    })

    describe('tab with typing', function () {
      before(function *() {
        yield newFrame(this.app.client)
        yield this.app.client.keys('a')
      })

      it('sets the value', function *() {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal('a')
      })

      it('clears the selected text', function *() {
        yield selectsText(this.app.client, '')
      })
    })

    describe('switch to default state tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 0)
          .waitUntil(function () {
            return this.getAttribute('.tabArea:first-of-type .tab', 'class').then(function (value) { return value.indexOf('active') !== -1 })
          })
      })

      it('preserves focused state', function *() {
        yield defaultUrl(this.app.client)
        yield hasFocus(this.app.client)
        yield selectsText(this.app.client)
      })
    })

    describe('switch to blurred tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 1)
          .waitUntil(function () {
            return this.getAttribute('.tabArea:nth-of-type(2) .tab', 'class').then(function (value) { return value.indexOf('active') !== -1 })
          })
      })

      it('preserves blurred state', function *() {
        yield blurred(this.app.client)
      })
    })

    describe('switch to typing tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 2)
          .waitUntil(function () {
            return this.getAttribute('.tabArea:nth-of-type(3) .tab', 'class').then(function (value) { return value.indexOf('active') !== -1 })
          })
      })

      it('preserves typing state', function *() {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal('a')
        yield selectsText(this.app.client, '')
      })
    })
  })

  describe('click', function () {
    describe('blurred', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield setup(this.app.client)
        yield blur(this.app.client)
        yield this.app.client
          .leftClick(urlInput)
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

    describe('focused', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield setup(this.app.client)
        yield this.app.client
          .leftClick(urlInput)
          .waitForVisible(urlInput)
      })

      it('displays the default url', function *() {
        yield defaultUrl(this.app.client)
      })

      it('has focus', function *() {
        yield hasFocus(this.app.client)
      })

      it('unselects the text', function *() {
        yield selectsText(this.app.client, '')
      })
    })
  })

  describe('shortcut-focus-url', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      yield blur(this.app.client)
      yield this.app.client
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
