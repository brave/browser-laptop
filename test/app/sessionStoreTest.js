/* global describe, it, before, after */

const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {navigator, urlInput, navigatorBookmarked, navigatorNotBookmarked} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')
const siteUtil = require('../../js/state/siteUtil')

describe('sessionStore', function () {
  function * setup (client) {
    Brave.addCommands()
  }

  describe('state is preserved', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      const page1Url = Brave.server.url('page1.html')
      const site = {
        location: page1Url,
        title: 'some page'
      }
      const key = siteUtil.getSiteKey(Immutable.fromJS(site))
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.app.client
        .clearAppData({browserHistory: true})
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .moveToObject(navigator)
        .waitForExist(navigatorNotBookmarked)
      yield Brave.app.client.addSite(site, siteTags.BOOKMARK)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            let state = val.value
            return Immutable.fromJS(state.sites).size === 1 && state.sites[key].location === page1Url
          })
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
        .waitForUrl(page1Url)
        .waitForBrowserWindow()
        .moveToObject(urlInput)
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === page1Url)
        })
    })

    it('appstate by preserving a bookmark', function * () {
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForExist(navigatorBookmarked)
    })
  })

  describe('firstRunTimestamp', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
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
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
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
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return (val.value.firstRunTimestamp === firstRunTimestamp)
          })
        })
    })
  })
})
