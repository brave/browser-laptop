/* global describe, it, before */

const Brave = require('../lib/brave')
const {activeWebview} = require('../lib/selectors')

describe('application window', function () {
  describe('application launch', function () {
    Brave.beforeAll(this)

    it('opens a window and loads the UI', function * () {
      yield this.app.client
        .waitUntilWindowLoaded()
        .waitForUrl(Brave.newTabUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(activeWebview)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .getWindowCount().should.become(1)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .isWindowMinimized().should.eventually.be.false
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .isWindowDevToolsOpened().should.eventually.be.false
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .isWindowVisible().should.eventually.be.true
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .isWindowFocused().should.eventually.be.true
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .getWindowWidth().should.eventually.be.getDefaultWindowWidth()
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .getWindowHeight().should.eventually.be.getDefaultWindowHeight()
    })
  })

  describe('appActions.newWindow', function () {
    describe('default', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield this.app.client
          .waitUntilWindowLoaded()
          .newWindowAction()
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2
            })
          })
          .windowByIndex(1)
          .waitUntilWindowLoaded()
      })

      it('offsets from the focused window', function * () {
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.x).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.x + 20)
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.y).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.y + 20)
      })

      it('has the default width and height', function * () {
        yield this.app.client
          .windowByIndex(1).getWindowWidth().should.eventually.be.getDefaultWindowWidth()
        yield this.app.client
          .windowByIndex(1).getWindowHeight().should.eventually.be.getDefaultWindowHeight()
      })
    })

    describe('after resize', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield this.app.client
          .waitUntilWindowLoaded()
          .resizeWindow(600, 700)
          .newWindowAction()
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2
            })
          })
          .windowByIndex(1)
          .waitUntilWindowLoaded()
      })

      it('offsets from the focused window', function * () {
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.x).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.x + 20)
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.y).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.y + 20)
      })

      it('has the width and height of the last window resize', function * () {
        yield this.app.client.windowByIndex(1)
          .getWindowWidth().should.become(600)
          .getWindowHeight().should.become(700)
      })
    })

    describe('after maximize', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield this.app.client
          .waitUntilWindowLoaded()
          .maximizeWindow()
          .newWindowAction()
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2 // two windows with two views each
            })
          })
          .windowByIndex(1) // the new browser window
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
      })

      it('is maximized', function * () {
        yield this.app.client
          .windowByIndex(1).getWindowWidth().should.eventually.be.getPrimaryDisplayWidth()
        yield this.app.client
          .windowByIndex(1).getWindowHeight().should.eventually.be.getPrimaryDisplayHeight()
      })

      it('opens without an offset', function * () {
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.x).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.x)
        yield this.app.client
          .windowByIndex(1).getWindowBounds().then((res) => res.y).should.eventually.be
          .windowByIndex(0).getWindowBounds().then((res) => res.y)
      })
    })
  })

  describe('windw.open with click', function () {
    describe('with features', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, 'page1', 'height=300, width=480, top=100, left=0')
            }
          }, this.page1)
          .click('#trigger')
      })

      it('opens in a new window', function * () {
        yield this.app.client
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2
            })
          })
      })

      it('set the url', function * () {
        yield this.app.client
          .waitForUrl(this.page1)
      })

      it('sets the width and height', function * () {
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowHeight().should.eventually.be.equal(375) // height plus navbar
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowWidth().should.eventually.be.equal(480)
      })

      it('sets the window position', function * () {
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowBounds().then((res) => res.x).should.eventually.be.equal(0)
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowBounds().then((res) => res.y).should.eventually.be.equal(100)
      })
    })

    describe('with width and height below min', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '', 'height=100, width=100')
            }
          }, this.page1)
          .click('#trigger')
          .waitUntil(function () {
            return this.getWindowCount().then((count) => {
              return count === 2
            })
          })
      })

      // Fails intermittently
      it.skip('loads and is visible', function * () {
        yield this.app.client
          .windowParentByUrl(this.page1)
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
      })

      it('has a min width of 480 and height of 300', function * () {
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowHeight().should.become(300)
        yield this.app.client
          .windowParentByUrl(this.page1)
          .getWindowWidth().should.become(480)
      })
    })

    // requires https://github.com/brave/browser-electron/issues/98
    describe('without features', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .windowByIndex(0)
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
          .tabByIndex(0)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            global.triggerFunction = function () {
              return window.open(page1, '_blank')
            }
          }, page1)
          .click('#trigger')
          .windowByIndex(0)
      })

      it('opens in a new tab', function * () {
        var selector = '.frameWrapper:nth-child(2) webview'
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForVisible(selector)
          .getAttribute(selector, 'src').should.become(page1)
          .getWindowCount().should.become(1)
          .getTabCount().should.become(2)
      })
    })

    // http://www.w3.org/TR/html51/browsers.html#security-window
    describe('window.opener', function () {
      describe('different document.domain', function () {
        Brave.beforeAll(this)

        before(function * () {
          this.window_open_page = Brave.server.url('window_open.html')
          this.page1 = Brave.server.urlWithIpAddress('page1.html')

          yield this.app.client
            .waitUntilWindowLoaded()
            .waitForVisible(activeWebview)
            .waitForUrl(Brave.newTabUrl)
            .url(this.window_open_page)
            .execute(function (page1) {
              global.triggerFunction = function () {
                return window.open(page1, 'page1', 'height=300, width=480, top=100, left=0')
              }
            }, this.page1)
            .click('#trigger')
            .waitUntil(function () {
              return this.getWindowCount().then((count) => {
                return count === 2
              })
            })
            // page1 loaded
            .waitForUrl(this.page1)
        })

        it('has parent document.domain set to localhost', function * () {
          yield this.app.client
            .tabByUrl(this.window_open_page)
            .execute(function () {
              return document.domain
            }).then((response) => response.value).should.eventually.be.equal('localhost')
        })

        it('has document.domain set to 127.0.0.1', function * () {
          yield this.app.client
            .tabByUrl(this.page1)
            .execute(function () {
              return document.domain
            }).then((response) => response.value).should.eventually.be.equal('127.0.0.1')
        })

        it('can communicate with the opener through postMessage', function * () {
          yield this.app.client
            // make sure the child window has focus
            .tabByUrl(this.window_open_page)
            .execute(function () {
              global.events = []
              window.addEventListener('message', function (event) {
                global.events.push(event.data)
              })
            })
            .tabByUrl(this.page1)
            .execute(function () {
              window.opener.postMessage('any origin', '*')
            })
            .execute(function (origin) {
              window.opener.postMessage('target origin', origin)
            }, Brave.server.urlOrigin())
            .execute(function () {
              window.opener.postMessage('other origin', 'https://somedomain.com')
            })
            .tabByUrl(this.window_open_page)
            .execute(function () {
              return global.events
            }).then((response) => response.value).should.become(['any origin', 'target origin'])
        })

        it('has restricted access in parent to child window', function * () {
          yield this.app.client
            .tabByUrl(this.window_open_page)
            .execute(function () {
              return window.WINDOW_REF.eval('1+2')
            }).should.be.rejectedWith(Error)
        })

        it('has restricted access to parent window through the opener', function * () {
          yield this.app.client
            .tabByUrl(this.page1)
            .execute(function () {
              return window.opener.eval('1+2')
            }).should.be.rejectedWith(Error)
        })
      })

      describe('same document.domain', function () {
        Brave.beforeAll(this)

        before(function * () {
          this.window_open_page = Brave.server.url('window_open.html')
          this.page1 = Brave.server.url('page1.html')
          var page1 = this.page1 // for wait closure

          yield this.app.client
            .waitUntilWindowLoaded()
            .waitForVisible(activeWebview)
            .tabByIndex(0)
            .url(this.window_open_page)
            .execute(function (page1) {
              global.triggerFunction = function () {
                return window.open(page1, 'page1', 'height=300, width=480, top=100, left=0')
              }
            }, this.page1)
            .click('#trigger')
            .waitUntil(function () {
              return this.getWindowCount().then((count) => {
                return count === 2
              })
            })
            // page1 loaded
            .tabByUrl(page1).getUrl().should.become(page1)
        })

        it('has parent document.domain set to localhost', function * () {
          yield this.app.client
            .tabByUrl(this.window_open_page)
            .execute(function () {
              return document.domain
            }).then((response) => response.value).should.eventually.be.equal('localhost')
        })

        it('has document.domain set to localhost', function * () {
          yield this.app.client
            .tabByUrl(this.page1)
            .execute(function () {
              return document.domain
            }).then((response) => response.value).should.eventually.be.equal('localhost')
        })

        it('has urestricted access in parent to child window', function * () {
          yield this.app.client
            .tabByUrl(this.window_open_page)
            .execute(function () {
              return window.WINDOW_REF.eval('1+2')
            }).then((response) => response.value).should.eventually.be.equal(3)
        })

        it('has urestricted access to parent window through the opener', function * () {
          yield this.app.client
            .tabByUrl(this.page1)
            .execute(function () {
              return window.opener.eval('1+2')
            })
            .then((response) => response.value)
            .should.eventually.be.equal(3)
        })

        it.skip('focuses the opener', function * () {
          yield this.app.client
            // make sure the child window has focus
            .tabByUrl(this.page1)
            .waitUntil(function () {
              return this.execute(function () {
                return document.hasFocus() === true
              })
            })
            .execute(function () {
              window.opener.focus()
            })
            // wait for focus
            .windowParentByUrl(this.window_open_page)
            .waitUntil(function () {
              return this.execute(function () {
                return (document.hasFocus() === true)
              })
            })
            .windowParentByUrl(this.window_open_page)
            .execute(function () {
              return document.hasFocus()
            }).then((response) => response.value).should.eventually.be.equal(true, 'expected opener to be focused, but was blurred')
        })

        it.skip('blurs the opener', function * () {
          yield this.app.client
            // make sure parent window has focus
            .tabByUrl(this.page1)
            .execute(function () {
              window.opener.focus()
            })
            .waitUntil(function () {
              return this.execute(function () {
                return document.hasFocus() === false
              })
            })
            // blur parent window
            .tabByUrl(this.page1)
            .execute(function () {
              window.opener.blur()
            })
            .windowParentByUrl(this.window_open_page)
            .waitUntil(function () {
              return this.execute(function () {
                return document.hasFocus() === false
              })
            })
            .execute(function () {
              return document.hasFocus()
            }).then((response) => response.value).should.eventually.be.equal(false, 'expected opener to be blurred, but was focused')
        })

        it('can be focused/blurred/closed by the opener')
      })
    })
  })

  describe('window.open with faked click', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.window_open_page = Brave.server.url('window_open.html')
      this.page1 = Brave.server.urlWithIpAddress('page1.html')

      yield this.app.client
        .waitUntilWindowLoaded()
        .waitForVisible(activeWebview)
        .tabByIndex(0)
        .url(this.window_open_page)
        .execute(function (page1) {
          global.triggerFunction = function () {
            return window.open(page1, 'page1', 'height=300, width=480, top=100, left=0')
          }
          document.getElementById('trigger').click()
        }, this.page1)
    })

    it('does not open a new window or tab', function * () {
      // this isn't a very good test because it could evaluate before the new
      // tab/window opens. Is there something else we can check?
      yield this.app.client
        .getWindowCount().should.become(1) // still just one window

      // still just one frame
      yield this.app.client.isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false
    })

    // https://app.asana.com/0/79517354322876/79040692096404
    it('triggers a popup warning messages')
  })

  // https://github.com/brave/browser-laptop/issues/98
  describe('window.open without click', function () {
    describe('default', function () {
      Brave.beforeAll(this)

      before(function * () {
        var page1 = Brave.server.url('page1.html')

        yield this.app.client
          .windowByIndex(0)
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
          .tabByIndex(0)
          .url(Brave.server.url('window_open.html'))
          .execute(function (page1) {
            window.open(page1, '_blank')
          }, page1)
      })

      // https://app.asana.com/0/41575558488236/45343396929071
      it('does not open a new window or tab', function * () {
        // this isn't a very good test because it could evaluate before the new
        // tab/window opens. Is there something else we can check?
        yield this.app.client
          .getWindowCount().should.become(1) // still just one window
        yield this.app.client.isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false // still just one frame
      })

      // https://app.asana.com/0/79517354322876/79040692096404
      it('triggers a popup warning messages')
    })

    // https://app.asana.com/0/63968741000775/79040692096405
    describe('domain allowed by preferences', function () {
      it('opens in a new tab')

      // https://app.asana.com/0/63968741000775/79040692096404
      it('does not trigger a popup warning messages')
    })
  })

  describe('click link', function () {
    describe('with target', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')
        this.page1 = Brave.server.url('page1.html')
        this.page2 = Brave.server.url('page2.html')

        yield this.app.client
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
          .tabByIndex(0)
          .url(this.clickWithTargetPage)
          .waitForVisible('#name')
          .click('#name')
      })

      it('opens in a new tab', function * () {
        let clickWithTargetPage = this.clickWithTargetPage
        let page1 = this.page1

        yield this.app.client
          .windowByIndex(0)
          .getAttribute('.frameWrapper:nth-child(1) webview', 'src').should.become(clickWithTargetPage)
        yield this.app.client
          .windowByIndex(0)
          .getAttribute('.frameWrapper:nth-child(2) webview', 'src').should.become(page1)
      })

      // https://github.com/brave/browser-laptop/issues/143
      it('loads in the tab with the target name', function * () {
        let clickWithTargetPage = this.clickWithTargetPage
        let page2 = this.page2

        yield this.app.client
          .windowByIndex(0)
          .click('.tabArea:nth-child(1)')
          .tabByIndex(0)
          .waitForVisible('#name2')
          .click('#name2')
          .windowByIndex(0)

        yield this.app.client
          .waitForVisible('.frameWrapper:nth-child(1) webview')
          .getAttribute('.frameWrapper:nth-child(1) webview', 'src').should.become(clickWithTargetPage)
        yield this.app.client
          .getAttribute('.frameWrapper:nth-child(2) webview', 'src').should.become(page2)
        yield this.app.client
          .isExisting('.frameWrapper:nth-child(3) webview').should.eventually.be.false // same tab
      })
    })

    describe('without target', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .url(this.clickWithTargetPage)
          .waitForVisible('#none')
          .click('#none')
      })

      it('loads in the current tab', function * () {
        yield this.app.client
          .waitForUrl(this.page1)
          .getWindowCount().should.become(1) // still just one window

        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false // still just one frame
      })
    })

    describe('with target _self', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .url(this.clickWithTargetPage)
          .waitForVisible('#_self')
          .click('#_self')
      })

      it('loads in the current tab', function * () {
        yield this.app.client
          .waitForUrl(this.page1)
          .getWindowCount().should.become(1) // still just one window

        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false // still just one frame
      })
    })

    describe('with target _parent', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .url(this.clickWithTargetPage)
          .frame('parent')
          .waitForVisible('#_parent')
          .click('#_parent')
      })

      it('sets the url of the parent frame in the same domain', function * () {
        yield this.app.client
          .waitForUrl(this.page1)
          .getWindowCount().should.become(1) // still just one window

        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false // still just one frame
      })
    })

    describe('with target  _top', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.clickWithTargetPage = Brave.server.url('click_with_target.html')
        this.page1 = Brave.server.url('page1.html')

        yield this.app.client
          .waitUntilWindowLoaded()
          .waitForVisible(activeWebview)
          .tabByUrl(Brave.newTabUrl)
          .url(this.clickWithTargetPage)
          .frame('parent')
          .frame('top')
          .waitForVisible('#_top')
          .click('#_top')
      })

      it('sets the url of the top-level frame in the same domain', function * () {
        var page1 = this.page1 // for wait closure
        yield this.app.client
          // page1 loaded
          .tabByUrl(page1).getUrl().should.become(page1)

        // this isn't a very good test because it could evaluate before the new
        // tab/window opens. Is there something else we can check?
        yield this.app.client
          .getWindowCount().should.become(1) // still just one window

        yield this.app.client.isExisting('.frameWrapper:nth-child(2) webview').should.eventually.be.false // still just one frame
      })
    })
  })

  describe('window.open of "modal" window', function () {
    it('has a min width of 100 and min height of 100')
  })
})
