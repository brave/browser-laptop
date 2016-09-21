/* global describe, it, before, after */

const Brave = require('../lib/brave')
const {navigator, urlInput, navigatorBookmarked, navigatorNotBookmarked} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')

describe('sessionStore', function () {
  function * setup (client) {
    Brave.addCommands()
    yield client
      .waitUntilWindowLoaded()
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('state is preserved', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      const page1Url = Brave.server.url('page1.html')
      this.timeout(30000)
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.app.client
        .tabByUrl(Brave.newTabUrl)
        .url(page1Url)
        .waitForUrl(page1Url)
        .windowParentByUrl(page1Url)
        .moveToObject(navigator)
        .waitForExist(navigatorNotBookmarked)
      yield Brave.app.client.addSite({
        location: page1Url,
        title: 'some page'
      }, siteTags.BOOKMARK)
      yield Brave.app.client
        .moveToObject(navigator)
        .waitForExist(navigatorBookmarked)
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === page1Url)
        })
      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setup(Brave.app.client)
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('windowState by preserving open page', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield Brave.app.client
        .moveToObject(urlInput)
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === page1Url)
        })
    })

    it('appstate by preserving a bookmark', function * () {
      yield Brave.app.client.waitForExist(navigatorBookmarked)
    })
  })

  describe('firstRunTimestamp', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      // AY: Why do I need to start, stop and start for this to work properly?
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setup(Brave.app.client)
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('sets it once', function * () {
      const timestamp = new Date().getTime()
      let firstRunTimestamp
      yield Brave.app.client
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            firstRunTimestamp = val.value.firstRunTimestamp
            return (
              firstRunTimestamp > (timestamp - 30 * 1000) &&
              firstRunTimestamp <= timestamp
            )
          })
        })

      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.app.client
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return (val.value.firstRunTimestamp === firstRunTimestamp)
          })
        })
    })
  })
})
