/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, backButton, forwardButton, pinnedTabsTabs} = require('../lib/selectors')
const messages = require('../../js/constants/messages')

describe('frame tests', function () {
  describe('clone tab', function () {
    describe('frame', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.url1 = Brave.server.url('page1.html')
        this.webview1 = '.frameWrapper:nth-child(1) webview'
        this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

        yield setup(this.app.client)
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.url1)
          .windowByUrl(Brave.browserWindowUrl)
          .cloneTabByIndex(0)
      })

      it('opens a new foreground tab', function * () {
        let url1 = this.url1
        yield this.app.client
          .waitForTabCount(2)
          .waitUntil(function () {
            return this.tabByIndex(1).getUrl().then((url) => {
              return url === url1
            })
          })
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist(this.webview1)
          .waitForExist(this.webview2)
          .tabByIndex(1)
          .waitForUrl(this.url1)
          .windowByUrl(Brave.browserWindowUrl)
      })
    })

    describe('index', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')

        yield setup(this.app.client)
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForUrl(Brave.newTabUrl)
          .url(this.clickWithTargetPage)
          .waitForVisible('#name')
          .click('#name')
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        yield this.app.client
          .ipcSend('shortcut-set-active-frame-by-index', 0)
          .windowByUrl(Brave.browserWindowUrl)
          .cloneTabByIndex(0)
          .waitForTabCount(3)
      })

      it('inserts after the tab to clone', function * () {
        this.tab1 = '.tabArea:nth-child(1) [data-test-id="tab"][data-frame-key="1"]'
        this.tab2 = '.tabArea:nth-child(2) [data-test-id="tab"][data-frame-key="3"]'
        this.tab3 = '.tabArea:nth-child(3) [data-test-id="tab"][data-frame-key="2"]'
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist(this.tab1)
          .waitForExist(this.tab2)
          .waitForExist(this.tab3)
      })
    })

    describe('history', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.url1 = Brave.server.url('page1.html')
        this.url2 = Brave.server.url('page2.html')
        this.webview1 = '.frameWrapper:nth-child(1) webview'
        this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

        yield setup(this.app.client)
        yield this.app.client
          .tabByIndex(0)
          // add some history
          .loadUrl(this.url1)
          .loadUrl(this.url2)
          .windowByUrl(Brave.browserWindowUrl)
          .cloneTabByIndex(0)
      })

      it('preserves the history', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .tabByIndex(1)
          .waitForUrl(this.url2)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist(backButton + ':not([disabled])')
          .waitForExist(forwardButton + '[disabled]')
          .click(backButton)
          .tabByIndex(1)
          .waitForUrl(this.url1)
          .windowByUrl(Brave.browserWindowUrl)
      })
    })

    describe('back-forward state', function () {
      Brave.beforeAll(this)
      before(function * () {
        this.url1 = Brave.server.url('page1.html')
        yield setup(this.app.client)
        yield this.app.client
          .waitForExist('.navigationButtonContainer.disabled .backButton')
          .tabByIndex(0)
          // add some history
          .loadUrl(this.url1)
          .windowByUrl(Brave.browserWindowUrl)
      })

      it('enables back button on first nav', function * () {
        yield this.app.client
          .waitForExist('.navigationButtonContainer:not(.disabled) .backButton')
      })

      it('enables forward button after pressing back', function * () {
        yield this.app.client
          .click(backButton)
          .waitForExist('.navigationButtonContainer:not(.disabled) .forwardButton')
      })
    })

    describe('back clone', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.url1 = Brave.server.url('page1.html')
        this.url2 = Brave.server.url('page2.html')
        this.webview1 = '.frameWrapper:nth-child(1) webview'
        this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

        yield setup(this.app.client)
        yield this.app.client
          .tabByIndex(0)
          // add some history
          .loadUrl(this.url1)
          .loadUrl(this.url2)
          .windowByUrl(Brave.browserWindowUrl)
          .cloneTabByIndex(0, {back: true})
      })

      it('preserves proper navigation', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .tabByIndex(1)
          .waitForUrl(this.url1)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist(backButton + ':not([disabled])')
          .waitForExist(forwardButton + ':not([disabled])')
          .click(forwardButton)
          .tabByIndex(1)
          .waitForUrl(this.url2)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist(backButton + ':not([disabled])')
          .waitForExist(forwardButton + '[disabled]')
      })
    })
  })

  describe('view source', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.url = Brave.server.url('find_in_page.html')
      // todo: move to selectors
      this.webview1 = '.frameWrapper:nth-child(1) webview'
      this.webview2 = '.frameWrapper:nth-child(2) webview'

      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
        .waitForExist(this.webview1)
    })

    it('should open in new tab', function * () {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
        .waitForTabCount(2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview2)
    })

    it('open from pinned tab', function * () {
      yield this.app.client
        .pinTabByIndex(1, true)
        .waitForElementCount(pinnedTabsTabs, 1)
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
        .waitForTabCount(2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview2)
    })
  })

  describe('resource loading', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
    })

    it('loads an image', function * () {
      let url = Brave.server.url('img/test.ico')
      yield this.app.client
        .tabByIndex(0)
        .url(url)
        .waitForUrl(url)
        .waitForVisible('img')
    })

    it('loads a PDF', function * () {
      let url = Brave.server.url('img/test.pdf')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.extensions['jdbefljfgobbmcidnmpjamcbhnbphjnb']
          })
        })
        .tabByIndex(0)
        .url(url)
        .waitForVisible('#viewerContainer')
    })
  })
})

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}
