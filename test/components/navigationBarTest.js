/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const config = require('../../js/constants/config')
const {urlBarSuggestions, urlInput, activeWebview, activeTabFavicon, activeTab, navigatorLoadTime,
  navigator, titleBar, urlbarIcon, bookmarksToolbar, navigatorNotBookmarked, navigatorBookmarked,
  saveButton, allowRunInsecureContentButton, dismissAllowRunInsecureContentButton,
  denyRunInsecureContentButton, dismissDenyRunInsecureContentButton} = require('../lib/selectors')
const urlParse = require('url').parse
const assert = require('assert')
const settings = require('../../js/constants/settings')
const searchProviders = require('../../js/data/searchProviders')
const messages = require('../../js/constants/messages')

describe('navigationBar', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForEnabled(urlInput)
  }

  function * newFrame (client, frameKey = 2) {
    yield client
      .ipcSend('shortcut-new-frame')
      // wait for correct urlInput based on frameKey
      .waitUntil(function () {
        return this.getTabCount().then((count) => {
          return count === frameKey
        })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible('div[id="navigator"][data-frame-key="' + frameKey + '"] ' + urlInput)
      .waitForElementFocus(urlInput)
  }

  function blur (client) {
    return client
      .waitForExist(activeWebview)
      .leftClick(activeWebview) // clear focus from urlbar
      .waitUntil(function () {
        return this.getSelectedText().then(function (value) { return value === '' })
      })
  }

  function defaultUrlInputValue (client) {
    return client.waitUntil(function () {
      return this.getAttribute(urlInput, 'value').then((value) => value === '')
    })
    .getAttribute(urlInput, 'placeholder').should.eventually.equal('Enter a URL or search term')
  }

  function selectsText (client, text = config.defaultUrl) {
    return client.waitUntil(function () {
      return this.getSelectedText().then(function (value) { return value === text })
    })
  }

  describe('navigation', function () {
    describe('tabnapping', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('tabnapping.html')
        yield setup(this.app.client)
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
          .waitForExist('#open_target')
          .leftClick('#open_target')
      })

      it('updates the location in the navbar when changed by the opener', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => val === 'data:text/html;,%3Ctitle%3ETabnapping%20Target%3C/title%3E')
          })
      })
    })

    describe('document.write spoofing', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('urlbarSpoof.html')
        yield setup(this.app.client)
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
          .waitForExist('input')
          .leftClick('input')
      })

      it('updates the location in the navbar to blank', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => {
              return val === ''
            })
          })
      })
    })

    describe('page with a title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        this.host = urlParse(this.page1Url).host
        yield setup(this.app.client)
        yield this.app.client.tabByUrl(Brave.newTabUrl).url(this.page1Url).waitForUrl(this.page1Url).windowParentByUrl(this.page1Url)
        yield this.app.client
          .moveToObject(navigator)
          .waitForExist(urlInput)
          .waitForValue(urlInput)
      })

      it('has title mode', function * () {
        const host = this.host
        yield this.app.client
          .moveToObject(activeWebview)
          .waitForExist(titleBar)
          .waitUntil(function () {
            return this.getText(titleBar).then((val) => val === host + ' | Page 1')
          })
          .isExisting(navigatorLoadTime).then((isExisting) => assert(!isExisting))
      })

      it('shows the url on mouseover', function * () {
        yield this.app.client
          .moveToObject(activeWebview)
          .moveToObject(titleBar)
          .waitForExist(navigatorLoadTime)
          .getValue(urlInput)
          .should.eventually.be.equal(this.page1Url)
      })

      it('exits title mode when focused', function * () {
        let page1Url = this.page1Url
        yield this.app.client
          .ipcSend('shortcut-focus-url')
          .moveToObject(activeWebview)
          .waitUntil(function () {
            return this.isExisting(titleBar).then((exists) => exists === false)
          })
        yield selectsText(this.app.client, page1Url)
      })
    })

    describe('page without a title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        this.pageNoTitle = Brave.server.url('page_no_title.html')
        yield setup(this.app.client)
        // Navigate to a page with a title first to ensure it gets reset
        yield this.app.client.tabByUrl(Brave.newTabUrl).url(this.page1Url).waitForUrl(this.page1Url)
        yield this.app.client
          .windowParentByUrl(this.page1Url)
          .moveToObject(navigator)
          .waitForExist(urlInput)
          .waitForValue(urlInput)
        yield this.app.client.tabByUrl(this.page1Url).url(this.pageNoTitle).waitForUrl(this.pageNoTitle)
        yield this.app.client
          .windowParentByUrl(this.pageNoTitle)
          .moveToObject(navigator)
          .waitForExist(urlInput)
          .waitForValue(urlInput)
      })

      it('does not have title mode', function * () {
        yield this.app.client
          .moveToObject(activeWebview)
          .waitUntil(function () {
            return this.isExisting(titleBar).then((exists) => exists === false)
          })
          .waitForExist(navigatorLoadTime)
      })
    })

    describe('links with url fragments', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page = Brave.server.url('url_fragments.html')
        var page = this.page
        yield setup(this.app.client)
        // Navigate to a page with a title first to ensure it gets reset
        yield this.app.client
          .tabByUrl(Brave.newTabUrl).url(this.page).waitForUrl(this.page).windowParentByUrl(this.page)
          .moveToObject(navigator)
          .waitForExist(urlInput)
          .waitForValue(urlInput)
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => val === page)
          })
          .waitUntil(function () {
            return this.getAttribute(activeWebview, 'src').then((src) => src === page)
          })
        yield this.app.client
          .tabByUrl(this.page)
          .waitForExist('#top_link')
          .leftClick('#top_link')
          .windowParentByUrl(this.page + '#top')
      })

      it('updates the location in the navbar', function * () {
        var page = this.page
        yield this.app.client
          .moveToObject(activeWebview)
          .waitForExist(titleBar)
          .moveToObject(titleBar)
          .waitForExist(urlInput)
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => val === page + '#top')
          })
      })

      it('updates the webview src', function * () {
        var page = this.page
        yield this.app.client
          .waitUntil(function () {
            return this.getAttribute(activeWebview, 'src').then((src) => src === page + '#top')
          })
      })
    })
  })

  describe('favicon', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('Uses the default favicon when one is not specified', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTabFavicon, 'background-image').then((backgroundImage) =>
          backgroundImage.value === `url("${Brave.server.url('favicon.ico')}")`
        ))
    })

    it('Parses favicon when one is present', function * () {
      const pageWithFavicon = Brave.server.url('favicon.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(pageWithFavicon).waitForUrl(pageWithFavicon).windowParentByUrl(pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTabFavicon, 'background-image').then((backgroundImage) =>
          backgroundImage.value === `url("${Brave.server.url('img/test.ico')}")`
      ))
    })
  })

  describe('lockIcon', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('Shows insecure URL icon', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client.waitUntil(() =>
        this.app.client
          .moveToObject(navigator)
          .waitForExist(urlbarIcon)
          .getAttribute(urlbarIcon, 'class').then((classes) =>
            classes.includes('fa-unlock')
        ))
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="insecureConnection"]')
        .keys('\uE00C')
    })
    it('Shows secure URL icon', function * () {
      const page1Url = 'https://badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .moveToObject(navigator)
        .waitForExist(urlbarIcon)
        .waitUntil(() =>
          this.app.client.getAttribute(urlbarIcon, 'class').then((classes) =>
            classes.includes('fa-lock')
          ))
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="secureConnection"]')
        .keys('\uE00C')
    })
    it('Blocks running insecure content', function * () {
      const page1Url = 'https://mixed-script.badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        // background color changes when insecure content runs
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlbarIcon + '.fa-lock')
        .click(urlbarIcon)
        .waitForVisible('.runInsecureContentWarning')
        .waitForVisible(dismissAllowRunInsecureContentButton)
        .waitForVisible(allowRunInsecureContentButton)
        .waitForVisible('[data-l10n-id="secureConnection"]')
        .click(dismissAllowRunInsecureContentButton)
        // TODO(bridiver) there is a race condition here because we are waiting for a non-change
        // and we need some way to verify that the page does not reload and allow insecure content
        .tabByUrl(page1Url).waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForExist(urlbarIcon + '.fa-lock')
    })
    it('Temporarily allow/deny running insecure content', function * () {
      const page1Url = 'https://mixed-script.badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        // background color changes when insecure content runs
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlbarIcon + '.fa-lock')
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="secureConnection"]')
        .waitForVisible('.runInsecureContentWarning')
        .waitForVisible(dismissAllowRunInsecureContentButton)
        .waitForVisible(allowRunInsecureContentButton)
        .click(allowRunInsecureContentButton)
        .tabByUrl(this.page1Url)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(255,0,0,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlbarIcon)
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="mixedConnection"]')
        .waitForVisible('.denyRunInsecureContentWarning')
        .waitForVisible(dismissDenyRunInsecureContentButton)
        .waitForVisible(denyRunInsecureContentButton)
        .click(denyRunInsecureContentButton)
        .tabByUrl(this.page1Url)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForExist(urlbarIcon + '.fa-lock')
    })
    it('Limit effect of running insecure content in frame', function * () {
      const page1Url = 'https://mixed-script.badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        // background color changes when insecure content runs
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlbarIcon + '.fa-lock')
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="secureConnection"]')
        .waitForVisible('.runInsecureContentWarning')
        .waitForVisible(dismissAllowRunInsecureContentButton)
        .waitForVisible(allowRunInsecureContentButton)
        .click(allowRunInsecureContentButton)
        .tabByIndex(0)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(255,0,0,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url)
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 2
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(1)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url, { isPrivate: true })
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 3
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(2)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url, { partitionNumber: 1 })
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 4
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(3)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
    })
    it.skip('Limit effect of running insecure content in private frame', function * () {
      const page1Url = 'https://mixed-script.badssl.com/'
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url, { isPrivate: true })
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 2
          })
        })
        // background color changes when insecure content runs
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(1)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlbarIcon + '.fa-lock')
        .click(urlbarIcon)
        .waitForVisible('[data-l10n-id="secureConnection"]')
        .waitForVisible('.runInsecureContentWarning')
        .waitForVisible(dismissAllowRunInsecureContentButton)
        .waitForVisible(allowRunInsecureContentButton)
        .click(allowRunInsecureContentButton)
        .tabByUrl(this.page1Url)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(255,0,0,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url)
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 3
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(2)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url, { isPrivate: true })
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 4
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(3)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1Url, { partitionNumber: 1 })
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 5
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(4)
        .waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
    })
  })

  describe('themeColor', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('Uses the default tab color when one is not specified', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      let background = yield this.app.client.getCssProperty(activeTab, 'background')
      assert.equal(background.value, 'rgba(0,0,0,0)linear-gradient(rgb(255,255,255),rgb(243,243,243))repeatscroll0%0%/autopadding-boxborder-box')
    })

    // We need a newer electron build first
    it.skip('Parses theme-color meta tag when one is present', function * () {
      const pageWithFavicon = Brave.server.url('theme_color.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(pageWithFavicon).waitForUrl(pageWithFavicon).windowParentByUrl(pageWithFavicon)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then((backgroundColor) =>
          backgroundColor.parsed.hex === '#4d90fe'
      ))
    })
    it.skip('Obtains theme color from the background', function * () {
      const redPage = Brave.server.url('red_bg.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(redPage).waitForUrl(redPage).windowParentByUrl(redPage)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then((backgroundColor) =>
          backgroundColor.parsed.hex === '#ff0000'))
    })
    it.skip('Obtains theme color from a top header and not background', function * () {
      const redPage = Brave.server.url('yellow_header.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(redPage).waitForUrl(redPage).windowParentByUrl(redPage)
      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty(activeTab, 'background-color').then((backgroundColor) =>
          backgroundColor.parsed.hex === '#ffff66'))
    })
  })

  describe('new window', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('has an empty url with placeholder', function * () {
      yield defaultUrlInputValue(this.app.client)
    })

    it('has focus', function * () {
      yield this.app.client.waitForElementFocus(urlInput)
    })
  })

  describe('new tab from ipc', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield newFrame(this.app.client)
    })

    it('has an empty url with placeholder', function * () {
      yield defaultUrlInputValue(this.app.client)
      yield selectsText(this.app.client, '')
    })

    it('has focus', function * () {
      yield this.app.client.waitForElementFocus(urlInput)
    })
  })

  describe('submit', function () {
    describe('page that does not load', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = 'https://bayden.com/test/redir/goscript.aspx'
        yield setup(this.app.client)
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys(page1)
        // hit enter
        yield this.app.client.keys('\uE007')
      })

      it('clears urlbar if page does not load', function * () {
        yield this.app.client
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => {
              console.log('value', val)
              return val === ''
            })
          })
      })
    })

    describe('with url input value', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1 = Brave.server.url('page1.html')

        yield setup(this.app.client)
        // wait for the urlInput to be fully initialized
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys(this.page1)
        // hit enter
        yield this.app.client.keys('\uE007')
      })

      it('webview has focus', function * () {
        yield this.app.client.waitForElementFocus(activeWebview)
      })

      it('webview loads url', function * () {
        var page1 = this.page1
        yield this.app.client.waitUntil(function () {
          return this.getAttribute(activeWebview, 'src').then((src) => src === page1)
        })
      })
    })

    describe('with non-url input value', function () {

    })

    describe('with javascript url input value', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        // wait for the urlInput to be fully initialized
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys('  javascript:alert(1)')
        // hit enter
        yield this.app.client.keys('\uE007')
      })
      it('filters javascript urls', function * () {
        yield this.app.client.waitUntil(function () {
          return this.getValue(urlInput).then((val) => !val.includes('javascript:'))
        })
      })
    })

    describe('page with focused form input', function () {
      it('loads the url without submitting the form')
    })
  })

  describe('typing', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })
      // now type something
      yield this.app.client.keys('a')
    })

    it('sets the value to "a"', function * () {
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'a')
      })
    })

    it('clears the selected text', function * () {
      yield selectsText(this.app.client, '')
    })

    describe('shortcut-focus-url', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-focus-url')
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function * () {
        yield selectsText(this.app.client, 'a')
      })

      it('has the file icon', function * () {
        yield this.app.client.waitForExist('.urlbarIcon.fa-file')
      })
    })

    describe('type escape once with suggestions', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'google')
          .waitForExist(urlBarSuggestions + ' li')

          // hit escape
          .keys('\uE00C')
          .waitForElementFocus(urlInput)
      })

      it('does not select the urlbar text', function * () {
        yield selectsText(this.app.client, '.com')
      })

      it('does not revert the urlbar text', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal('google.com')
      })
    })

    describe('type escape once with no suggestions', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'random-uuid-d63ecb78-eec8-4c08-973b-fb39cb5a6f1a')

          // hit escape
          .keys('\uE00C')
          .waitForElementFocus(urlInput)
      })

      it('does select the urlbar text', function * () {
        yield selectsText(this.app.client, this.page)
      })

      it('does revert the urlbar text', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(this.page)
      })
    })

    describe('type escape twice', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'blah')
          // hit escape
          .keys('\uE00C')
          .waitForElementFocus(urlInput)
          .keys('\uE00C')
      })

      it('selects the urlbar text', function * () {
        yield selectsText(this.app.client, this.page)
      })

      it('sets the urlbar text to the webview src', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(this.page)
      })
    })

    describe('submitting by typing a URL', function () {
      before(function * () {
        const url = Brave.server.url('page1.html')
        return yield this.app.client.ipcSend('shortcut-focus-url')
          .setValue(urlInput, url)
          // hit enter
          .keys('\uE007')
      })

      it('changes the webview src', function * () {
        const url = Brave.server.url('page1.html')
        yield this.app.client.waitUntil(function () {
          return this.getAttribute(activeWebview, 'src').then((src) => src === url)
        })
      })
    })
  })

  describe('search engine go key', function () {
    Brave.beforeEach(this)
    const entries = searchProviders.providers

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
    })

    entries.forEach((entry) => {
      describe(entry.name, function () {
        beforeEach(function * () {
          yield this.app.client
            .keys(entry.shortcut + ' ')
        })

        it('has the icon', function * () {
          yield this.app.client
            .waitForExist(urlbarIcon)
            .waitUntil(function () {
              return this
                .getCssProperty(urlbarIcon, 'background-image')
                .then((backgroundImage) => backgroundImage.value === `url("${entry.image}")`)
            })
        })
      })
    })
  })

  // need to move urlbar state to frame before enabling these
  describe('change tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      // default tab
      yield setup(this.app.client)
      // tab with typing
      yield newFrame(this.app.client, 2)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.keys('a').getValue(urlInput).then((val) => val === 'a')
        })
      // tab with loaded url
      yield newFrame(this.app.client, 3)
      yield this.app.client
        .tabByIndex(2)
        .url(Brave.server.url('page1.html'))
        .waitForUrl(Brave.server.url('page1.html'))
        .windowByUrl(Brave.browserWindowUrl)
    })

    describe('switch to default state tab', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 0)
          .waitForVisible('div[id="navigator"][data-frame-key="1"] ' + urlInput)
      })

      it('shows the default location', function * () {
        yield defaultUrlInputValue(this.app.client)
        yield selectsText(this.app.client, '')
      })

      it('focuses on the webview', function * () {
        this.app.client.waitUntil(function () {
          return this.getAttribute(':focus', 'src').then((src) => src === config.defaultUrl)
        })
      })
    })

    describe('switch to typing tab', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 1)
          .waitForVisible('div[id="navigator"][data-frame-key="2"] ' + urlInput)
      })

      it('preserves typing state', function * () {
        yield this.app.client
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => val === 'a')
          })
        yield selectsText(this.app.client, '')
      })
    })

    describe('switch to url loaded tab', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 2)
      })

      it('focuses on the webview', function * () {
        this.app.client.waitUntil(function () {
          return this.getAttribute(':focus', 'src').then((src) => src === Brave.server.url('page1.html'))
        })
      })
    })

    describe('switch to new tab page', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 1)
      })

      it('focuses on the urlbar', function * () {
        this.app.client
        .waitForExist('.tab[data-frame-key="1"].active')
        .waitForElementFocus(urlInput)
      })
    })
  })

  describe('clicking on navbar', function () {
    describe('blurred', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.waitForElementFocus(urlInput)
        yield this.app.client.waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === '')
        })
        // now type something
        yield this.app.client.keys('a')
        yield this.app.client.waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === 'a')
        })
        yield blur(this.app.client)
        yield this.app.client
          .waitForExist(urlInput)
          .leftClick(urlInput)
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function * () {
        yield selectsText(this.app.client, 'a')
      })
    })

    describe('focused', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        // type anything
        yield this.app.client.keys('a')
          .waitForExist(urlInput)
          .leftClick(urlInput)
          // click when already focused
          .leftClick(urlInput)
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('unselects the text', function * () {
        yield selectsText(this.app.client, '')
      })
    })
  })

  describe('shortcut-focus-url', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield blur(this.app.client)
      yield this.app.client.ipcSend('shortcut-focus-url')
    })

    it('has an empty url with placeholder', function * () {
      yield defaultUrlInputValue(this.app.client)
    })

    it('has focus', function * () {
      yield this.app.client.waitForElementFocus(urlInput)
    })
  })

  describe('auto open bookmarks toolbar for the first bookmark', function () {
    Brave.beforeAll(this)

    before(function * () {
      const page1Url = Brave.server.url('page1.html')

      yield setup(this.app.client)

      yield this.app.client
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
        .tabByUrl(this.newTabUrl)
        .url(page1Url)
        .waitForUrl(page1Url)
        .windowParentByUrl(page1Url)
        .moveToObject(navigator)
        .waitForExist(navigatorNotBookmarked)
        .moveToObject(navigator)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
        .click(saveButton)
        .waitForExist(navigatorBookmarked)
    })

    it('should open if user has no bookmarks', function * () {
      yield this.app.client
        .moveToObject(navigator)
        .isExisting(bookmarksToolbar).should.eventually.be.true
    })

    it('should remain hidden if user has bookmarks but has toolbar hidden', function * () {
      const page1Url = Brave.server.url('page1.html')
      const page2Url = Brave.server.url('page2.html')

      // user don't like toolbars
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, false)

      yield this.app.client
        .waitForUrl(page1Url)
        .waitForVisible('#thelink')
        .click('#thelink')
        .waitForUrl(page2Url)
        .windowParentByUrl(page2Url)
        .moveToObject(navigator)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
        .click(saveButton)
        .waitForExist(navigatorBookmarked)

      yield this.app.client.isExisting(bookmarksToolbar).should.eventually.be.false
    })
  })
})
