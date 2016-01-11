/* global describe, it, before */

const Brave = require('./lib/brave')
const Config = require('../js/constants/config').default
const {urlInput, activeWebview, activeTabFavicon, activeTab, navigatorLoadTime} = require('./lib/selectors')
const assert = require('assert')

describe('urlbar', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  function * newFrame (client, frameKey = 2) {
    yield client
      .ipcSend('shortcut-new-frame')
      // wait for correct urlInput based on frameKey
      .waitForVisible('div[id="navigator"][data-frame-key="' + frameKey + '"] ' + urlInput)
      // wait for selection
      .waitUntil(function () {
        return this.getAttribute('div[id="navigator"][data-frame-key="' + frameKey + '"] ' + urlInput, 'selectionEnd').then(function (value) { return value > 0 })
      })
    // wait for focus
    yield hasFocus(client)
  }

  function blur (client, text = Config.defaultUrl) {
    return client
      .keys('\uE007') // clear focus
      .waitUntil(function () {
        return this.getSelectedText().then(function (value) { return value === '' })
      })
  }

  function hasFocus (client) {
    return client.waitUntil(function () {
      return this.getAttribute(':focus', 'id').then(function (value) { return value === 'urlInput' })
    })
  }

  function defaultUrl (client) {
    return client.waitForValue(urlInput, Config.defaultUrl)
  }

  function * navigate (client, url) {
    yield client.ipcSend('shortcut-focus-url')
      .setValue(urlInput, url)
      // hit enter
      .keys('\uE007')
      .waitUntil(function () {
        return this.getAttribute(activeWebview, 'src').then(src => src === url)
      })
  }

  function selectsText (client, text = Config.defaultUrl) {
    return client.waitUntil(function () {
      return this.getSelectedText().then(function (value) { return value === text })
    })
  }

  describe('navigation', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('loads a page with a title', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      return yield this.app.client.waitForValue(urlInput)
        // Should have title mode
        .getValue(urlInput)
        .should.eventually.be.equal('Page 1')
        // Check for exiting title mode
        .isExisting(navigatorLoadTime).then(isExisting =>
            assert(!isExisting))
        .moveToObject(urlInput)
        .waitForExist(navigatorLoadTime)
        .getValue(urlInput)
        .should.eventually.be.equal(page1Url)
    })

    it('exits title mode when focused', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      return yield this.app.client.ipcSend('shortcut-focus-url', false)
        .getValue(urlInput)
        .should.eventually.be.equal(page1Url)
    })

    it('exits title mode when focused for search hmode', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      return yield this.app.client.ipcSend('shortcut-focus-url', true)
        .getValue(urlInput)
        .should.eventually.be.equal(page1Url)
    })

    it('loads a page with no title', function *() {
      const page1Url = Brave.server.url('page_no_title.html')
      yield navigate(this.app.client, page1Url)
      return yield this.app.client.waitForValue(urlInput)
        .getValue(urlInput)
        .should.eventually.be.equal(page1Url)
    })
  })

  describe('favicon', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('Uses the default favicon when one is not specified', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTabFavicon, 'background-image').then(backgroundImage =>
          backgroundImage.value === `url("${Brave.server.url('favicon.ico')}")`
        ))
    })
    it('Parses favicon when one is present', function *() {
      const pageWithFavicon = Brave.server.url('favicon.html')
      yield navigate(this.app.client, pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTabFavicon, 'background-image').then(backgroundImage =>
          backgroundImage.value === `url("${Brave.server.url('img/test.ico')}")`
      ))
    })
  })

  describe('themeColor', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('Uses the default tab color when one is not specified', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      let backgroundColor = yield this.app.client.getCssProperty(activeTab, 'background-color')
      assert.equal(backgroundColor.parsed.hex, '#ffffff')
    })

    // We need a newer electron build first
    it.skip('Parses theme-color meta tag when one is present', function *() {
      const pageWithFavicon = Brave.server.url('theme_color.html')
      yield navigate(this.app.client, pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then(backgroundColor =>
          backgroundColor.parsed.hex === '#4d90fe'
      ))
    })
    it.skip('Obtains theme color from favicon', function *() {
      const pageWithFavicon = Brave.server.url('favicon.html')
      yield navigate(this.app.client, pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then(backgroundColor => {
          console.log(backgroundColor.parsed.hex)
          backgroundColor.parsed.hex === '#320f07'
        }
      ))
    })
  })

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
      this.app.client
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

  describe('submit', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      // wait for the urlInput to be fully initialized
      yield selectsText(this.app.client)
      // hit enter
      yield this.app.client.keys('\uE007')
    })

    it('clears the selected text', function *() {
      yield selectsText(this.app.client, '')
    })

    it('gives focus to the webview', function () {
      this.app.client.waitUntil(function () {
        return this.getAttribute(':focus', 'src').then(src => src === Config.defaultUrl)
      })
    })

    describe('url input value', function () {

    })

    describe('non-url input value', function () {

    })
  })

  describe('typing', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      // wait for the urlInput to be fully initialized
      yield selectsText(this.app.client)
      // now type something
      yield this.app.client.keys('a')
    })

    it('sets the value', function *() {
      yield this.app.client.waitForValue(urlInput, 'a')
    })

    it('clears the selected text', function *() {
      yield selectsText(this.app.client, '')
    })

    describe('shortcut-focus-url', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-focus-url', false)
      })

      it('has focus', function *() {
        yield hasFocus(this.app.client)
      })

      it('selects the text', function *() {
        yield selectsText(this.app.client, 'a')
      })
      it('has the file icon', function *() {
        yield this.app.client.waitForExist('.urlbarIcon.fa-file-o')
      })
    })

    describe('shortcut-focus-url for search', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-focus-url', true)
      })

      it('has focus', function *() {
        yield hasFocus(this.app.client)
      })

      it('selects the text', function *() {
        yield selectsText(this.app.client, 'a')
      })

      it('has the search icon', function *() {
        yield this.app.client.waitForExist('.urlbarIcon.fa-search')
      })
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

    before(function *() {
      // default tab
      yield setup(this.app.client)
      // tab with typing
      yield newFrame(this.app.client, 2)
      yield this.app.client.keys('a').waitForValue(urlInput, 'a')
      // tab with loaded url
      yield newFrame(this.app.client, 3)
      yield navigate(this.app.client, Brave.server.url('page1.html'))
    })

    describe('switch to default state tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 0)
          .waitForVisible('div[id="navigator"][data-frame-key="1"] ' + urlInput)
          // wait for selection??
      })

      it('preserves focused state', function *() {
        yield defaultUrl(this.app.client)
        yield hasFocus(this.app.client)
        yield selectsText(this.app.client)
      })
    })

    describe('switch to typing tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 1)
          .waitForVisible('div[id="navigator"][data-frame-key="2"] ' + urlInput)
      })

      it('preserves typing state', function *() {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal('a')
        yield selectsText(this.app.client, '')
      })
    })

    describe('switch to url loaded tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 2)
      })

      it('preserves focus on the webview', function *() {
        this.app.client.waitUntil(function () {
          return this.getAttribute(':focus', 'src').then(src => src === Brave.server.url('page1.html'))
        })
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
      yield this.app.client.ipcSend('shortcut-focus-url')
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
