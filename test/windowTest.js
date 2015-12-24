/* global describe, it, before */

const Brave = require('./lib/brave')
const Selectors = require('./lib/selectors')

describe('application window', function () {
  describe('application launch', function () {
    Brave.beforeAll(this)

    it('opens a window and loads the UI', function *() {
      yield this.app.client
        .waitUntilWindowLoaded()
        .waitForVisible(Selectors.activeWebview)
        .getWindowCount().should.eventually.equal(2) // main window and webview
        .isWindowMinimized().should.eventually.be.false
        .isWindowDevToolsOpened().should.eventually.be.false
        .isWindowVisible().should.eventually.be.true
        .isWindowFocused().should.eventually.be.true
        .getWindowWidth().should.eventually.be.getDefaultWindowWidth()
        .getWindowHeight().should.eventually.be.getDefaultWindowHeight()
        .waitForVisible('#window')
    })
  })

  describe('AppActions.newWindow', function () {
    describe('default', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield this.app.client
          .waitUntilWindowLoaded()
          .newWindowAction()
      })

      it('opens a new window', function *() {
        yield this.app.client
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 4 // two windows with two views each
            })
          })
          .waitForVisible(Selectors.activeWebview)
      })

      it('offsets from the focused window', function *() {
        yield this.app.client
          .getWindowBounds().then((res) => res.x).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.x + 20)
        yield this.app.client
          .getWindowBounds().then((res) => res.y).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.y + 20)
      })

      it('has the default width and height', function *() {
        yield this.app.client
          .getWindowWidth().should.eventually.be.getDefaultWindowWidth()
        yield this.app.client
          .getWindowHeight().should.eventually.be.getDefaultWindowHeight()
      })
    })

    describe('after resize', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield this.app.client
          .waitUntilWindowLoaded()
          .resizeWindow(1000, 1000)
          .newWindowAction()
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 4 // two windows with two views each
            })
          })
          .waitUntilWindowLoaded()
          .waitForVisible(Selectors.activeWebview)
      })

      it('offsets from the focused window', function *() {
        yield this.app.client
          .getWindowBounds().then((res) => res.x).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.x + 20)
        yield this.app.client
          .getWindowBounds().then((res) => res.y).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.y + 20)
      })

      it('has the widht and height of the last window resize', function *() {
        yield this.app.client
          .getWindowWidth().should.eventually.be.equal(1000)
        yield this.app.client
          .getWindowHeight().should.eventually.be.equal(1000)
      })
    })

    describe('after maximize', function () {
      Brave.beforeAll(this)

      before(function *() {
        yield this.app.client
          .waitUntilWindowLoaded()
          .maximizeWindow()
          .newWindowAction()
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 4 // two windows with two views each
            })
          })
          .waitUntilWindowLoaded()
          .waitForVisible(Selectors.activeWebview)
      })

      it('is maximized', function *() {
        yield this.app.client
          .getWindowWidth().should.eventually.be.getPrimaryDisplayWidth()
        yield this.app.client
          .getWindowHeight().should.eventually.be.getPrimaryDisplayHeight()
      })

      it('opens without an offset', function *() {
        yield this.app.client
          .getWindowBounds().then((res) => res.x).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.x)
        yield this.app.client
          .getWindowBounds().then((res) => res.y).should.eventually.be.windowByIndex(0).getWindowBounds().then((res) => res.y)
      })
    })
  })

  describe('onClick windw.open', function () {
    describe('with features', function () {
      Brave.beforeAll(this)

      before(function *() {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitUntilWindowLoaded()
          .waitForVisible(Selectors.activeWebview)
          .windowByIndex(1)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '_blank', 'height=300, width=500, top=100, left=0')
            }
          }, page1)
          .click('#trigger')
      })

      it('opens in a new window', function *() {
        yield this.app.client.waitUntil(function () {
          return this.getWindowCount().then((count) => {
            return count === 4 // two windows with two views each
          })
        })
        .windowByIndex(2) // window 2
        .waitUntilWindowLoaded()
        .waitForVisible(Selectors.activeWebview)
      })

      it('set the url', function *() {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .windowByIndex(3) // inner webview of window 2
          .waitUntil(function () {
            return this.getUrl().then(url => url === page1)
          })
      })

      it('sets the width and height', function *() {
        yield this.app.client
          .windowByIndex(2)
          .getWindowHeight().should.eventually.be.equal(375) // height plus navbar
        yield this.app.client
          .windowByIndex(2)
          .getWindowWidth().should.eventually.be.equal(500)
      })

      it('sets the window position', function *() {
        yield this.app.client
          .windowByIndex(2)
          .getWindowBounds().then((res) => res.x).should.eventually.be.equal(0)
        yield this.app.client
          .windowByIndex(2)
          .getWindowBounds().then((res) => res.y).should.eventually.be.equal(100)
      })
    })

    describe('with width and height below min', function () {
      Brave.beforeAll(this)

      before(function *() {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForVisible(Selectors.activeWebview)
          .windowByIndex(1)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '', 'height=100, width=100')
            }
          }, page1)
          .click('#trigger')
      })

      it('opens in a new window', function *() {
        yield this.app.client.waitUntil(function () {
          return this.getWindowCount().then((count) => {
            return count === 4 // two windows with two views each
          })
        })
        .windowByIndex(2) // window 2
        .waitUntilWindowLoaded()
        .waitForVisible(Selectors.activeWebview)
      })

      it('has a min width of 500 and height of 300', function *() {
        yield this.app.client
          .windowByIndex(2) // window 2
          .getWindowHeight().should.eventually.equal(300)
        yield this.app.client
          .windowByIndex(2) // window 2
          .getWindowWidth().should.eventually.equal(500)
      })
    })

    // requires https://github.com/brave/browser-electron/issues/98
    describe.skip('without features', function () {
      Brave.beforeAll(this)

      before(function *() {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitUntilWindowLoaded()
          .waitForVisible(Selectors.activeWebview)
          .windowByIndex(1)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '_blank')
            }
          }, page1)
          .click('#trigger')
      })

      it('opens in a new tab', function *() {
        var selector = 'frameWrapper:nth-child(2) webview'
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForVisible(selector)
          .waitUntil(function () {
            return this.getAttribute(selector, 'src').then(src => src === page1)
          })
          .getWindowCount().should.eventually.equal(2) // still just one window
      })
    })

    describe('with target _self', function () {
      Brave.beforeAll(this)

      it('should set current frame url', function *() {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForVisible(Selectors.activeWebview)
          .windowByIndex(1)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '_self')
            }
          }, page1)
          .click('#trigger')
          .windowByIndex(0)
          .waitForVisible(Selectors.activeWebview)
          .windowByIndex(1)
          .waitUntil(function () {
            return this.getUrl().then(url => url === page1)
          })
      })
    })
  })

  // requires https://github.com/brave/browser-electron/issues/97
  // also see https://app.asana.com/0/41575558488236/45343396929071
  describe('window.open without onClick', function () {
    describe('domain blocked by preferences', function () {
      it('should trigger a popup warning messages')
    })

    describe('domain not blocked by preferences', function () {
      it('should open in a new window')
    })
  })

  // requires https://github.com/brave/browser-electron/issues/98
  describe('click link', function () {
    describe('with target', function () {
      it('should open in a new tab')
    })

    describe('without target', function () {
      it('should open in the current tab')
    })
  })

  describe('window.open of "modal" window', function () {
    it('has a min width of 100 and min height of 100')
  })
})
