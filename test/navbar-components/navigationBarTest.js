/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const config = require('../../js/constants/config')
const {urlInput, activeWebview, activeTabFavicon, activeTab, navigatorLoadTime,
  titleBar, urlBarIcon, bookmarksToolbar, navigatorNotBookmarked, navigatorBookmarked,
  doneButton, allowRunInsecureContentButton, dismissAllowRunInsecureContentButton,
  denyRunInsecureContentButton, dismissDenyRunInsecureContentButton, activeTabTitle,
  homeButton} = require('../lib/selectors')
const urlParse = require('url').parse
const assert = require('assert')
const settings = require('../../js/constants/settings')
const messages = require('../../js/constants/messages')

describe('navigationBar tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForEnabled(urlInput)
      .changeSetting(settings.DISABLE_TITLE_MODE, false)
  }

  function * newFrame (client, frameKey = 2) {
    yield client
      .newTab()
      // wait for correct urlInput based on frameKey
      .waitForTabCount(frameKey)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible('div[id="navigator"][data-frame-key="' + frameKey + '"] ' + urlInput)
      .waitForElementFocus(urlInput)
  }

  function blur (client) {
    return client
      .waitForExist(activeWebview)
      .leftClick(activeWebview, 0, 0) // clear focus from urlbar
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
    describe('focus', function () {
      Brave.beforeAll(this)
      before(function * () {
        const page1 = Brave.server.url('page1.html')
        yield this.app.client
          .waitForBrowserWindow()
          .waitForUrl(Brave.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .keys(Brave.keys.ENTER)
      })

      it('webview has focus after initial load', function * () {
        yield this.app.client.waitForElementFocus(activeWebview)
      })

      it('webview has focus after second load', function * () {
        yield this.app.client
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .keys(Brave.keys.ENTER)
          .waitForElementFocus(activeWebview)
      })

      it('newtab hasfocus in urlbar', function * () {
        yield this.app.client
          .newTab()
          .waitUntil(function () {
            return this.getWindowState().then((val) => {
              return val.value.frames.length === 2
            })
          })
          .waitForElementFocus(urlInput)
          .ipcSend(messages.SHORTCUT_CLOSE_FRAME, 2)
      })
      it('newtab with page has focus in webview', function * () {
        var page1Url = Brave.server.url('tabnapping.html')
        yield this.app.client
          .newTab({ url: page1Url })
          .waitUntil(function () {
            return this.getWindowState().then((val) => {
              return val.value.frames.length === 2
            })
          })
          .waitForElementFocus(activeWebview)
      })
    })
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
          .ipcSend('shortcut-focus-url')
          .waitForInputText(urlInput, 'data:text/html;,<title>Tabnapping Target</title>')
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
          .waitForInputText(urlInput, 'about:blank')
      })
    })

    describe.skip('window.open spoofing', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('spoof_opener.html')
        yield setup(this.app.client)
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
          .waitForExist('a')
          .leftClick('a')
          .windowByIndex(0)
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2
            })
          })
      })

      it('does not show faked page title', function * () {
        yield this.app.client
          .windowByIndex(1)
          .activateURLMode()
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => {
              return val.startsWith('https://www.example.com/')
            })
          })
          .getText(activeTabTitle)
          .then((title) => assert(title !== 'fake page'))
      })
    })

    describe('iframe navigation', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('in_page_nav.html')
        yield setup(this.app.client)
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
      })

      it('location does not change', function * () {
        var page1 = Brave.server.url('in_page_nav.html')
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForInputText(urlInput, page1)
      })
    })

    describe('User input', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
        var page1 = Brave.server.url('page1.html')
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .loadUrl(page1)
      })

      it('remains cleared when onChange is fired but not onKeyUp', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible(urlInput)
          .setValue(urlInput, '')
          .moveToObject(activeWebview)
          .click(activeWebview)
          .activateURLMode()
          .click(urlInput)
          .waitForInputText(urlInput, '')
      })
    })

    describe('page with a title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        this.host = urlParse(this.page1Url).host
        yield setup(this.app.client)
        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowParentByUrl(this.page1Url)
          .activateURLMode()
          .waitForValue(urlInput)
      })

      it('has title mode', function * () {
        yield this.app.client
          .activateTitleMode()
          .click(activeWebview)
          .windowParentByUrl(this.page1Url)
          .waitForExist(titleBar)
          .waitForTextValue(titleBar, `${this.host} | Page 1`)
          .isExisting(navigatorLoadTime).then((isExisting) => assert(!isExisting))
      })

      it('shows the url on mouseover', function * () {
        yield this.app.client
          .moveToObject(activeWebview)
          .click(activeWebview)
          .moveToObject(titleBar)
          .waitForExist(navigatorLoadTime)
          .waitForValue(urlInput, this.page1Url)
      })

      it('exits title mode when focused', function * () {
        let page1Url = this.page1Url
        yield this.app.client
          .ipcSend('shortcut-focus-url')
          .moveToObject(activeWebview)
          .waitForElementCount(titleBar, 0)
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
          .activateURLMode()
          .waitForValue(urlInput)
        yield this.app.client.tabByUrl(this.page1Url).url(this.pageNoTitle).waitForUrl(this.pageNoTitle)
        yield this.app.client
          .windowParentByUrl(this.pageNoTitle)
          .activateURLMode()
          .waitForValue(urlInput)
      })

      it('does not have title mode', function * () {
        yield this.app.client
          .moveToObject(activeWebview)
          .waitForElementCount(titleBar, 0)
          .waitForExist(navigatorLoadTime)
      })
    })

    describe('links with url fragments', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page = Brave.server.url('url_fragments.html')
        yield setup(this.app.client)
        // Navigate to a page with a title first to ensure it gets reset
        yield this.app.client
          .tabByUrl(Brave.newTabUrl).url(this.page).waitForUrl(this.page).windowParentByUrl(this.page)
          .activateURLMode()
          .waitForValue(urlInput)
          .waitForInputText(urlInput, this.page)
          .tabByUrl(this.page)
          .waitForExist('#bottom_link')
          .leftClick('#bottom_link')
          .windowParentByUrl(this.page + '#bottom')
      })

      it('updates the location in the navbar', function * () {
        var page = this.page
        yield this.app.client
          .activateTitleMode()
          .click(activeWebview)
          .waitForExist(titleBar)
          .moveToObject(titleBar)
          .waitForExist(urlInput)
          .waitForInputText(urlInput, `${page}#bottom`)
      })

      it('scrolls to the url fragment', function * () {
        yield this.app.client
          .tabByUrl(this.page)
          // should scroll to bottom and top will not be visible because the div height is 99999px
          .waitForVisible('#bottom', 1000)
          .waitForVisible('#top', 500)
      })
    })
  })

  describe('favicon', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('Parses favicon when one is present', function * () {
      const pageWithFavicon = Brave.server.url('favicon.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(pageWithFavicon).waitForUrl(pageWithFavicon).windowParentByUrl(pageWithFavicon)
      yield this.app.client.waitUntil(function () {
        return this.getCssProperty(activeTabFavicon, 'background-image').then((backgroundImage) =>
          backgroundImage.value === `url("${Brave.server.url('img/test.ico')}")`)
      })
    })

    it('Fallback to default icon when no one is specified', function * () {
      const pageWithNoFavicon = Brave.server.url('page_no_favicon.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(pageWithNoFavicon).waitForUrl(pageWithNoFavicon).windowParentByUrl(pageWithNoFavicon)
      yield this.app.client.waitUntil(function () {
        return this.getAttribute('[data-test-id="defaultIcon"]', 'class').then((className) =>
          className.includes('fa fa-file-o'))
      })
    })
  })

  describe('lockIcon', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('Shows insecure URL icon', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .waitUntil(() =>
          this.app.client
            .activateURLMode()
            .waitForExist(urlBarIcon)

            // TODO: Fix
            .getAttribute(urlBarIcon, 'class').then((classes) =>
              classes.includes('fa-unlock') && classes.includes('insecure-color')
        ))
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="insecureConnection"]')
        .keys(Brave.keys.ESCAPE)
    })

    it('Shows phishing URL warning', function * () {
      const page1Url = 'data:text/html,<body>i am google</body>'
      yield this.app.client
        .waitForElementFocus(urlInput)
        .keys(page1Url)
        .keys(Brave.keys.ENTER)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(() =>
          this.app.client
            .activateURLMode()
            .waitForExist(urlBarIcon)

            // TODO: Fix
            .getAttribute(urlBarIcon, 'class').then((classes) =>
              classes.includes('fa-exclamation-triangle') && classes.includes('insecure-color')
        ))
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('[data-test-id="phishingConnectionInfo"]')
        .keys(Brave.keys.ESCAPE)
    })
    it('Shows insecure URL icon in title mode', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .activateURLMode()
        .waitForValue(urlInput)
        .activateTitleMode()
        .click(activeWebview)
        .waitForExist(titleBar)
        .waitForVisible(urlBarIcon, 1)
        .getAttribute(urlBarIcon, 'class').then((classes) =>
          classes.includes('fa-unlock') && classes.includes('insecure-color')
        )
    })
    it('Shows secure URL icon', function * () {
      const page1Url = 'https://badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForExist(urlBarIcon)
        .waitUntil(() =>
          this.app.client.getAttribute(urlBarIcon, 'class').then((classes) =>
            classes.includes('fa-lock')
          ))
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="secureConnection"]')
        .keys(Brave.keys.ESCAPE)
    })
    it('Shows secure URL icon in title mode', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .activateURLMode()
        .waitForValue(urlInput)
        .activateTitleMode()
        .click(activeWebview)
        .waitForExist(titleBar)
        .waitForVisible(urlBarIcon, 1)
        .getAttribute(urlBarIcon, 'class').then((classes) =>
          classes.includes('fa-lock')
        )
    })
    it('does not show secure icon if page load fails', function * () {
      const page1Url = Brave.server.url('ssl_spoof.html')
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForExist(urlBarIcon)
        .getAttribute(urlBarIcon, 'class').then((classes) =>
          assert(!classes.includes('fa-lock'))
        )
    })
    it('shows partially-secure icon on a site with passive mixed content', function * () {
      const page1Url = 'https://mixed.badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForExist(urlBarIcon)
        .waitUntil(() =>
          this.app.client.getAttribute(urlBarIcon, 'class').then((classes) =>
            classes.includes('fa-unlock') && !classes.includes('insecure-color')
          )
        )
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="partiallySecureConnection"]')
    })
    it('shows insecure icon on a site with a sha-1 cert', function * () {
      const page1Url = 'https://sha1-2017.badssl.com/'
      yield this.app.client.tabByUrl(Brave.newTabUrl).url(page1Url).waitForUrl(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForExist(urlBarIcon)
        .waitUntil(() =>

          // TODO: Fix
          this.app.client.getAttribute(urlBarIcon, 'class').then((classes) =>
            classes.includes('fa-unlock') && classes.includes('insecure-color')
          )
        )
    })

    it('shows insecure icon on an HTTP PDF', function * () {
      const page1Url = Brave.server.url('img/test.pdf')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.extensions['jdbefljfgobbmcidnmpjamcbhnbphjnb']
          })
        })
      yield this.app.client.tabByIndex(0).url(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForInputText(urlInput, page1Url)
        .waitForExist(urlBarIcon)
        .waitUntil(() =>

          // TODO: Fix
          this.app.client.getAttribute(urlBarIcon, 'class').then((classes) =>
            classes.includes('fa-unlock') && classes.includes('insecure-color')
          )
        )
    })

    it('shows secure icon on an HTTPS PDF', function * () {
      const page1Url = 'https://letsencrypt.org/documents/ISRG-CPS-October-18-2016.pdf'
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.extensions['jdbefljfgobbmcidnmpjamcbhnbphjnb']
          })
        })
      yield this.app.client.tabByIndex(0).url(page1Url).windowParentByUrl(page1Url)
      yield this.app.client
        .activateURLMode()
        .waitForInputText(urlInput, page1Url)
        .waitForExist(urlBarIcon)
        .waitUntil(() =>
          this.app.client.getAttribute(urlBarIcon, 'class').then((classes) =>
            classes.includes('fa-lock')
          )
        )
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
        .waitForExist(urlBarIcon + '.fa-lock')
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="runInsecureContentWarning"]')
        .waitForVisible(dismissAllowRunInsecureContentButton)
        .waitForVisible(allowRunInsecureContentButton)
        .waitForVisible('[data-test-id="secureConnection"]')
        .click(dismissAllowRunInsecureContentButton)
        // TODO(bridiver) there is a race condition here because we are waiting for a non-change
        // and we need some way to verify that the page does not reload and allow insecure content
        .tabByUrl(page1Url).waitUntil(() => {
          return this.app.client.getCssProperty('body', 'background-color').then((color) =>
            color.value === 'rgba(128,128,128,1)'
          )
        })
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlBarIcon)
        .waitForExist(urlBarIcon + '.fa-lock')
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
        .waitForExist(urlBarIcon + '.fa-lock')
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="secureConnection"]')
        .waitForVisible('[data-test-id="runInsecureContentWarning"]')
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
        .waitForExist(urlBarIcon)
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="insecureConnection"]')
        .waitForVisible('[data-test-id="denyRunInsecureContentWarning"]')
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
        .click(urlBarIcon)
        .waitForExist(urlBarIcon + '.fa-lock')
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
        .waitForExist(urlBarIcon + '.fa-lock')
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="secureConnection"]')
        .waitForVisible('[data-test-id="runInsecureContentWarning"]')
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
        .newTab({ url: page1Url })
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
        .newTab({ url: page1Url, isPrivate: true })
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
        .newTab({ url: page1Url, partitionNumber: 1 })
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
    it('Limit effect of running insecure content in private frame', function * () {
      const page1Url = 'https://mixed-script.badssl.com/'
      yield this.app.client
        .newTab({ url: page1Url, isPrivate: true })
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
        .waitForExist(urlBarIcon + '.fa-lock')
        .click(urlBarIcon)
        .waitForVisible('[data-test-id="secureConnection"]')
        .waitForVisible('[data-test-id="runInsecureContentWarning"]')
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
        .newTab({ url: page1Url })
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
        .newTab({ url: page1Url, isPrivate: true })
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
        .newTab({ url: page1Url, partitionNumber: 1 })
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
      let background = yield this.app.client.getCssProperty('[data-test-active-tab]', 'background')
      assert.equal(background.value, 'rgb(255,255,255)nonerepeatscroll0%0%/autopadding-boxborder-box')
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

  describe('new tab', function () {
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
      Brave.beforeEach(this)

      beforeEach(function * () {
        this.page1 = Brave.server.url('page1.html')
        this.page2 = 'https://bayden.com/test/redir/goscript.aspx'
        yield setup(this.app.client)
        yield this.app.client
          .waitForBrowserWindow()
          .waitForExist(urlInput)
          .waitForElementFocus(urlInput)
      })

      it('sets location to new URL', function * () {
        const page2 = this.page2
        yield this.app.client.keys([this.page2, Brave.keys.ENTER])
        yield this.app.client
          .waitForInputText(urlInput, page2)
      })

      it('resets URL to previous location if page does not load', function * () {
        const page1 = this.page1
        yield this.app.client
          .tabByUrl(this.newTabUrl)
          .url(page1)
          .waitForUrl(page1)
          .windowParentByUrl(page1)
          .activateTitleMode()
          .click(activeWebview)
          .activateURLMode()
          .click(urlInput)
        yield selectsText(this.app.client, page1)
        yield this.app.client
          .keys(this.page2)
          .keys(Brave.keys.ENTER)
          .waitForInputText(urlInput, page1)
      })
    })

    describe('with url input value', function () {
      describe('with regards to the webview', function () {
        Brave.beforeAll(this)

        before(function * () {
          this.page1 = Brave.server.url('page1.html')

          yield setup(this.app.client)
          // wait for the urlInput to be fully initialized
          yield this.app.client.waitForExist(urlInput)
            .keys(this.page1)
            // hit enter
            .keys(Brave.keys.ENTER)
        })

        it('webview has focus', function * () {
          yield this.app.client.waitForElementFocus(activeWebview)
        })

        it('urlbar shows webview url when focused', function * () {
          yield blur(this.app.client)
          yield this.app.client
            .waitForElementCount(urlInput, 0)
            .ipcSend('shortcut-focus-url')
            .waitForInputText(urlInput, this.page1)
            .keys('zzz')
            .waitForInputText(urlInput, 'zzz')
        })
      })

      describe('when following URLs', function () {
        Brave.beforeEach(this)

        beforeEach(function * () {
          yield setup(this.app.client)
          yield this.app.client.waitForExist(urlInput)
        })

        it('goes to the page (instead of search for the URL)', function * () {
          const url = 'https://brave.com/page/cc?_ri_=3vv-8-e.'
          yield this.app.client.keys(url)
          yield this.app.client.keys(Brave.keys.ENTER)
            .waitForInputText(urlInput, url)
        })
      })
    })

    describe('with non-url input value', function () {

    })

    describe('with no url input value', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1 = Brave.server.url('page1.html')
        yield setup(this.app.client)
        yield this.app.client
          .waitForExist(urlInput)
        yield this.app.client
          .keys(this.page1)
        yield this.app.client
          .keys(Brave.keys.ENTER)
      })

      it('shows search icon when input is empty', function * () {
        // test that url is shown with proper icon
        // before getting cleared
        yield this.app.client
          .waitForExist(urlBarIcon)
          .getAttribute(urlBarIcon, 'class').then(classes => classes.includes('fa-unlock'))

        // ensure that once cleaned, search icon
        // is shown instead of protocol icon
        yield this.app.client
          .setValue(urlInput, '')
          .waitForExist(urlBarIcon)
          .getAttribute(urlBarIcon, 'class').then(classes => classes.includes('fa-search'))
      })
    })

    describe('with javascript url input value', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        // wait for the urlInput to be fully initialized
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys('  javascript:alert(1)')
        // hit enter
        yield this.app.client.keys(Brave.keys.ENTER)
      })

      it('filters javascript urls', function * () {
        yield this.app.client.waitUntil(function () {
          return this.getValue(urlInput).then((val) => !val.includes('javascript:'))
        })
      })
    })

    describe('with auth url input value', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        yield this.app.client.waitForExist(urlInput)
        yield this.app.client.keys('brave.com@example.com')
        // hit enter
        yield this.app.client.keys(Brave.keys.ENTER)
      })
      it('hides auth part of the url', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'http://example.com/')
      })
    })

    describe('with about page url input values', function () {
      Brave.beforeEach(this)

      beforeEach(function * () {
        yield setup(this.app.client)
        yield this.app.client.waitForExist(urlInput)
      })
      it('hides "about:newtab" inside the URL bar', function * () {
        yield this.app.client
          .tabByUrl(this.newTabUrl)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForInputText(urlInput, '')
      })
      it('shows "about:blank" in the URL bar', function * () {
        yield this.app.client
          .keys('about:blank')
          .keys(Brave.keys.ENTER)
          .waitForInputText(urlInput, 'about:blank')
      })
      it('shows the search icon in URL bar for "about:newtab"', function * () {
        yield this.app.client
          .tabByUrl(this.newTabUrl)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist('[data-test-id="urlBarIcon"].fa-search')
      })
      it('shows the list icon in URL bar for other about pages', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .keys('about:about')
          .keys(Brave.keys.ENTER)
          .tabByUrl('about:about')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForInputText(urlInput, 'about:about')
          .waitForExist('[data-test-id="urlBarIcon"].fa-list')
      })
    })

    describe('page with focused form input', function () {
      it('loads the url without submitting the form')
    })
  })

  describe('home button', function () {
    describe('when enabled', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        yield this.app.client
          .changeSetting(settings.SHOW_HOME_BUTTON, true)
      })

      it('displays the button', function * () {
        yield this.app.client
          .waitForVisible(homeButton)
      })

      it('goes to the home page when clicked', function * () {
        const page1Url = Brave.server.url('page1.html')

        yield this.app.client
          .changeSetting(settings.HOMEPAGE, page1Url)
          .waitForVisible(homeButton)
          .click(homeButton)
          .waitForUrl(page1Url)
      })

      it('opens home page in a new tab when cmd/ctrl is pressed', function * () {
        const page2Url = Brave.server.url('page2.html')

        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .changeSetting(settings.HOMEPAGE, page2Url)
          .waitForVisible(homeButton)
          .isDarwin().then((val) => {
            if (val === true) {
              return this.app.client.keys(Brave.keys.COMMAND)
            } else {
              return this.app.client.keys(Brave.keys.CONTROL)
            }
          })
          .click(homeButton)
          .waitForTabCount(2)
          .waitForUrl(page2Url)
      })

      it('opens home page in a new tab when middle mouse button is clicked', function * () {
        const page3Url = Brave.server.url('page3.html')

        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .changeSetting(settings.HOMEPAGE, page3Url)
          .waitForVisible(homeButton)
          .middleClick(homeButton)
          .waitForTabCount(3)
          .waitForUrl(page3Url)
      })
    })

    describe('when disabled', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        yield this.app.client
          .changeSetting(settings.SHOW_HOME_BUTTON, false)
      })

      it('does not display the button', function * () {
        yield this.app.client
          .waitForVisible(homeButton, 500, true)
      })
    })
  })

  // need to move urlbar state to frame before enabling these
  describe.skip('change tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      // default tab
      yield setup(this.app.client)
      // tab with typing
      yield newFrame(this.app.client, 2)
      yield this.app.client
        .waitForTabCount(2)
        .windowByUrl(Brave.browserWindowUrl)
        .keys('a')
        .waitForInputText(urlInput, 'a')
      // tab with loaded url
      yield newFrame(this.app.client, 3)
      yield this.app.client
        .waitForTabCount(3)
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
        this.app.client
          .waitForUrl(config.defaultUrl)
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
          .waitForInputText(urlInput, 'a')
          .waitUntil(function () {
            return this.getSelectedText().then(function (value) { return value === '' })
          })
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
        .waitForExist('[data-test-active-tab][data-frame-key="1"]')
        .waitForElementFocus(urlInput)
      })
    })
  })

  describe('clicking on navbar', function () {
    describe('blurred', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
        yield this.app.client
          .waitForExist(urlInput)
          .waitForElementFocus(urlInput)
          .waitForInputText(urlInput, '')
          .addSite({ location: 'https://brave.com', title: 'Brave' })
          .waitForSiteEntry('https://brave.com')
          .keys('br')
        yield selectsText(this.app.client, 'ave.com')
        yield blur(this.app.client)
        yield this.app.client
          .activateURLMode()
          .leftClick(urlInput)
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function * () {
        yield selectsText(this.app.client, 'brave.com')
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
        .waitForSiteEntry(page1Url)
        .activateURLMode()
        .waitForExist(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(page1Url, 'Page 1')
        .waitForEnabled(doneButton)
        .click(doneButton)
        .activateTitleMode()
        .activateURLMode()
        .waitForExist(navigatorBookmarked)
    })

    it('should open if user has no bookmarks', function * () {
      yield this.app.client
        .activateURLMode()
        .waitForVisible(bookmarksToolbar, 1)
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
        .activateURLMode()
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(page2Url, 'Page 2')
        .waitForEnabled(doneButton)
        .click(doneButton)
        .activateURLMode()
        .waitForExist(navigatorBookmarked)
        .waitForElementCount(bookmarksToolbar, 0)
    })
  })
})
