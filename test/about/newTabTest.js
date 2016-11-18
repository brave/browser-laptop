/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutNewTabUrl = getTargetAboutUrl('about:newtab')

describe('about:newtab tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  function * loadPageWithTracker (client) {
    const url = Brave.server.url('tracking.html')
    yield client
      .waitForDataFile('trackingProtection')
      .tabByIndex(0)
      .loadUrl(url)
  }

  function * loadPageWithAdblock (client) {
    const url = Brave.server.url('adblock.html')
    yield client
      .waitForDataFile('adblock')
      .tabByIndex(0)
      .loadUrl(url)
      .windowByUrl(Brave.browserWindowUrl)
  }

  function * reloadNewTab (client) {
    yield client
      .tabByIndex(0)
      .loadUrl(aboutNewTabUrl)
  }

  describe('page content', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('displays a clock', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('.tab[data-frame-key="1"]')
        .tabByIndex(0)
        .waitForVisible('.clock .time')
        .waitUntil(function () {
          return this.getText('.clock .time')
            .then((clockTime) => {
              return !!clockTime.match(/^\d{1,2}.*\d{2}.*/)
            })
        })
    })

    // TODO(bsclifton):
    // - link check
    // has link to settings
    // has link to bookmarks
    // has link to history
  })

  describe('when displaying stats', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('shows # trackers blocked', function * () {
      yield loadPageWithTracker(this.app.client)

      yield reloadNewTab(this.app.client)

      yield this.app.client
        .waitForVisible('.counter.trackers')
        .waitUntil(function () {
          return this.getText('.counter.trackers')
            .then((blocked) => {
              return blocked === '2'
            })
        })
    })

    it('shows # ads blocked', function * () {
      yield loadPageWithAdblock(this.app.client)

      yield reloadNewTab(this.app.client)

      yield this.app.client
        .waitForVisible('.counter.ads')
        .waitUntil(function () {
          return this.getText('.counter.ads')
            .then((blocked) => {
              return blocked === '1'
            })
        })
    })

    // TODO(bsclifton):
    // upgrades
    // shows a time based on # blocked
  })

  describe('with the top sites tile area', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('shows a preloaded list of sites if session has no entries yet', function * () {
      yield reloadNewTab(this.app.client)

      yield this.app.client
        .waitForVisible('.topSitesElementFavicon[href^="https://twitter.com/brave"]')
        .waitForVisible('.topSitesElementFavicon[href^="https://www.facebook.com/BraveSoftware"]')
        .waitForVisible('.topSitesElementFavicon[href^="https://www.youtube.com"]')
        .waitForVisible('.topSitesElementFavicon[href^="https://brave.com"]')
        .waitForVisible('.topSitesElementFavicon[href^="https://itunes.apple.com"]')
        .waitForVisible('.topSitesElementFavicon[href^="https://play.google.com/store"]')
    })

    it('shows sites that have been visited', function * () {
      yield loadPageWithTracker(this.app.client)

      yield reloadNewTab(this.app.client)

      yield this.app.client
        .waitForVisible('.topSitesElementFavicon')
    })

    it('lets you pin a tile (and shows the pinned icon afterwards)', function * () {
      yield loadPageWithTracker(this.app.client)

      yield reloadNewTab(this.app.client)

      yield this.app.client
        .waitForVisible('.topSitesElementFavicon')
        .moveToObject('.topSitesElement')
        .waitForVisible('.topSitesActionContainer')
        .click('.topSitesActionBtn')
        .moveToObject('.timeSaved')
        .waitForVisible('.pinnedTopSite')
    })
  })
})
