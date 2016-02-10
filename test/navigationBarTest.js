/* global describe, it, before */

const Brave = require('./lib/brave')
const Config = require('../js/constants/config').default
const {urlInput, activeWebview, activeTabFavicon, activeTab, navigatorLoadTime, titleBar, urlbarIcon} = require('./lib/selectors')
const urlParse = require('url').parse
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
      .waitForElementFocus(urlInput)
  }

  function blur (client) {
    return client
      .leftClick(activeWebview) // clear focus from urlbar
      .waitUntil(function () {
        return this.getSelectedText().then(function (value) { return value === '' })
      })
  }

  function defaultUrlInputValue (client) {
    return client.waitUntil(function () {
      return this.getAttribute(urlInput, 'value').then(value => value === '')
    })
    .getAttribute(urlInput, 'placeholder').should.eventually.equal('Search or enter an address')
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
    describe('page with a title', function () {
      Brave.beforeAll(this)

      before(function *() {
        this.page1Url = Brave.server.url('page1.html')
        this.host = urlParse(this.page1Url).host
        yield setup(this.app.client)
        yield navigate(this.app.client, this.page1Url)
        yield this.app.client.waitForValue(urlInput)
      })

      it('has title mode', function *() {
        const host = this.host
        yield this.app.client.waitUntil(function () {
          return this.getText(titleBar).then(val => val === host + ' | Page 1')
        })
        .isExisting(navigatorLoadTime).then(isExisting => assert(!isExisting))
      })

      it('shows the url on mouseover', function *() {
        yield this.app.client
          .moveToObject(urlInput)
          .waitForExist(navigatorLoadTime)
          .getValue(urlInput)
          .should.eventually.be.equal(this.page1Url)
      })

      it('exits title mode when focused', function *() {
        let page1Url = this.page1Url
        yield this.app.client
          .ipcSend('shortcut-focus-url', false)
          .waitUntil(function () {
            return this.getCssProperty(titleBar, 'display').then(display => display.value === 'none')
          })
        yield selectsText(this.app.client, page1Url)
      })
    })

    describe('page without a title', function () {
      Brave.beforeAll(this)

      before(function *() {
        this.page1Url = Brave.server.url('page1.html')
        this.pageNoTitle = Brave.server.url('page_no_title.html')
        yield setup(this.app.client)
        // Navigate to a page with a title first to ensure it gets reset
        yield navigate(this.app.client, this.page1Url)
        yield this.app.client.waitForValue(urlInput)
        yield navigate(this.app.client, this.pageNoTitle)
        yield this.app.client.waitForValue(urlInput)
      })

      it('does not have title mode', function *() {
        yield this.app.client
          .waitUntil(function () {
            return this.getCssProperty(titleBar, 'display').then(display => display.value === 'none')
          })
          .waitForExist(navigatorLoadTime)
      })
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

  describe('lockIcon', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('Shows insecure URL icon', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield navigate(this.app.client, page1Url)
      yield this.app.client.waitUntil(() =>
        this.app.client
          .moveToObject(urlInput)
          .getAttribute(urlbarIcon, 'class').then(classes =>
            classes.includes('fa-unlock')
        ))
    })
    it('Shows secure URL icon', function *() {
      const page1Url = Brave.server.url('page1.html').replace('http', 'https')
      yield navigate(this.app.client, page1Url)
      yield this.app.client
        .moveToObject(urlInput)
        .waitUntil(() =>
          this.app.client.getAttribute(urlbarIcon, 'class').then(classes =>
            classes.includes('fa-lock')
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
      assert.equal(backgroundColor.parsed.hex, '#f3f3f3')
    })

    // We need a newer electron build first
    it('Parses theme-color meta tag when one is present', function *() {
      const pageWithFavicon = Brave.server.url('theme_color.html')
      yield navigate(this.app.client, pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then(backgroundColor =>
          backgroundColor.parsed.hex === '#4d90fe'
      ))
    })
    it('Obtains theme color from the background', function *() {
      const redPage = Brave.server.url('red_bg.html')
      yield navigate(this.app.client, redPage)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then(backgroundColor =>
          backgroundColor.parsed.hex === '#ff0000'))
    })
    it('Obtains theme color from a top header and not background', function *() {
      const redPage = Brave.server.url('yellow_header.html')
      yield navigate(this.app.client, redPage)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then(backgroundColor =>
          backgroundColor.parsed.hex === '#ffff66'))
    })
  })

  describe('new window', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
    })

    it('has an empty url with placeholder', function *() {
      yield defaultUrlInputValue(this.app.client)
    })

    it('has focus', function *() {
      yield this.app.client.waitForElementFocus(urlInput)
    })

    it('selects the text', function *() {
      yield selectsText(this.app.client, '')
    })
  })

  describe('new tab from ipc', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      yield newFrame(this.app.client)
    })

    it('has an empty url with placeholder', function *() {
      yield defaultUrlInputValue(this.app.client)
      yield selectsText(this.app.client, '')
    })

    it('has focus', function *() {
      yield this.app.client.waitForElementFocus(urlInput)
    })
  })

  describe('submit', function () {
    describe('with url input value', function () {
      Brave.beforeAll(this)

      before(function *() {
        this.page1 = Brave.server.url('page1.html')

        yield setup(this.app.client)
        // wait for the urlInput to be fully initialized
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys(this.page1)
        // hit enter
        yield this.app.client.keys('\uE007')
      })

      it('gives focus to the webview', function () {
        this.app.client.waitUntil(function () {
          return this.getAttribute(':focus', 'src').then(src => src === this.page1)
        })
      })
    })

    describe('with non-url input value', function () {

    })

    describe('page with focused form input', function () {
      it('loads the url without submitting the form')
    })
  })

  describe('typing', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
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
        yield this.app.client.waitForElementFocus(urlInput)
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
        yield this.app.client.waitForElementFocus(urlInput)
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
      yield this.app.client
        .waitUntil(function () {
          return this.keys('a').getValue(urlInput).then(val => val === 'a')
        })
      // tab with loaded url
      yield newFrame(this.app.client, 3)
      yield navigate(this.app.client, Brave.server.url('page1.html'))
    })

    describe('switch to default state tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 0)
          .waitForVisible('div[id="navigator"][data-frame-key="1"] ' + urlInput)
      })

      it('shows the default location', function *() {
        yield defaultUrlInputValue(this.app.client)
        yield selectsText(this.app.client, '')
      })

      it('focuses on the webview', function *() {
        this.app.client.waitUntil(function () {
          return this.getAttribute(':focus', 'src').then(src => src === Config.defaultUrl)
        })
      })
    })

    describe('switch to typing tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 1)
          .waitForVisible('div[id="navigator"][data-frame-key="2"] ' + urlInput)
      })

      it('preserves typing state', function *() {
        yield this.app.client
          .waitUntil(function () {
            return this.getValue(urlInput).then(val => val === 'a')
          })
        yield selectsText(this.app.client, '')
      })
    })

    describe('switch to url loaded tab', function () {
      before(function *() {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 2)
      })

      it('focuses on the webview', function *() {
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
        // type anything
        yield this.app.client.keys('a')
        yield blur(this.app.client)
        yield this.app.client
          .leftClick(urlInput)
      })

      it('has focus', function *() {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function *() {
        yield selectsText(this.app.client, 'a')
      })
    })

    describe('focused', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield setup(this.app.client)
        // type anything
        yield this.app.client.keys('a')
        yield this.app.client
          .leftClick(urlInput)
        // click when already focused
        yield this.app.client
          .leftClick(urlInput)
      })

      it('has focus', function *() {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('unselects the text', function *() {
        yield selectsText(this.app.client, '')
      })
    })
  })

  describe('escape', function () {
    it('sets the urlbar text to the webview src')

    it('selects the urlbar text')
  })

  describe('shortcut-focus-url', function () {
    Brave.beforeAll(this)

    before(function *() {
      yield setup(this.app.client)
      yield blur(this.app.client)
      yield this.app.client.ipcSend('shortcut-focus-url')
    })

    it('has an empty url with placeholder', function *() {
      yield defaultUrlInputValue(this.app.client)
    })

    it('has focus', function *() {
      yield this.app.client.waitForElementFocus(urlInput)
    })
  })
})
