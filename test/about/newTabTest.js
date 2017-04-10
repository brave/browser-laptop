/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, navigator, navigatorBookmarked, navigatorNotBookmarked, doneButton} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const settings = require('../../js/constants/settings')
const {newTabMode} = require('../../app/common/constants/settingsEnums')
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

    waitForPageLoad(client)
  }

  function * reloadNewTab (client) {
    yield client
      .tabByIndex(0)
      .loadUrl(aboutNewTabUrl)
      .waitForUrl(aboutNewTabUrl)
  }

  function * addDemoAboutPages (client) {
    yield client
      .addSite({ location: 'about:about' })
      .addSite({ location: 'about:adblock' })
      .addSite({ location: 'about:autofill' })
      .addSite({ location: 'about:blank' })
      .addSite({ location: 'about:bookmarks' })
      .addSite({ location: 'about:brave' })
      .addSite({ location: 'about:certerror' })
      .addSite({ location: 'about:config' })
      .addSite({ location: 'about:downloads' })
      .addSite({ location: 'about:error' })
      .addSite({ location: 'about:extensions' })
      .addSite({ location: 'about:history' })
      .addSite({ location: 'about:newtab' })
      .addSite({ location: 'about:passwords' })
      .addSite({ location: 'about:preferences' })
      .addSite({ location: 'about:safebrowsing' })
      .addSite({ location: 'about:styles' })
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutNewTabUrl)
  }

  function * waitForPageLoad (client) {
    yield client
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
  }

  describe('with NEWTAB_MODE === HOMEPAGE', function () {
    const page1 = 'https://start.duckduckgo.com/'
    const page2 = 'https://brave.com/'

    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.changeSetting(settings.NEWTAB_MODE, newTabMode.HOMEPAGE)
      yield this.app.client.changeSetting(settings.HOMEPAGE, `${page1}|${page2}`)
    })

    it('multiple homepages', function * () {
      yield this.app.client
        .newTab()
        .waitForUrl(page1)
    })
  })

  describe.skip('with NEWTAB_MODE === NEW_TAB_PAGE', function () {
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
          .waitForTextValue('.counter.trackers', '2')
      })

      // NOTE(bsclifton): this test can take 20+ seconds to run :(
      it('shows # ads blocked', function * () {
        yield loadPageWithAdblock(this.app.client)

        yield reloadNewTab(this.app.client)

        yield this.app.client
          .waitForVisible('.counter.ads')
          .waitForTextValue('.counter.ads', '1')
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
        yield this.app.client.onClearBrowsingData({browserHistory: true})

        yield loadPageWithTracker(this.app.client)

        yield reloadNewTab(this.app.client)

        yield this.app.client
          .waitForVisible('.topSitesElementFavicon')
      })

      it('lets you pin a tile (and shows the pinned icon afterwards)', function * () {
        yield this.app.client.onClearBrowsingData({browserHistory: true})

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

      it('doesn\'t show about pages on topSites grid', function * () {
        yield this.app.client.onClearBrowsingData({browserHistory: true})

        // Adding about pages shouldn't add them to topSites grid
        yield addDemoAboutPages(this.app.client)

        // Bookmarking an about:page should not add it to grid as well
        yield this.app.client
          .tabByUrl(aboutNewTabUrl)
          .windowParentByUrl(aboutNewTabUrl)
          .waitForVisible(navigator)
          .activateURLMode()
          .waitForVisible(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForVisible(doneButton)
          .click(doneButton)
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)

        yield reloadNewTab(this.app.client)

        yield this.app.client
          .waitForElementCount('.topSitesElementFavicon', 0)
      })

      it('shows favicon image for topSites', function * () {
        const pageWithFavicon = Brave.server.url('favicon.html')
        yield this.app.client
          .onClearBrowsingData({browserHistory: true})
          .tabByUrl(Brave.newTabUrl)
          .url(pageWithFavicon)
          .waitForUrl(pageWithFavicon)
          .windowParentByUrl(pageWithFavicon)

        yield reloadNewTab(this.app.client)

        yield this.app.client
          .waitForVisible('.topSitesElementFavicon img')
      })

      it('replace topSites favicon images with a letter when no icon is found', function * () {
        yield this.app.client.onClearBrowsingData({browserHistory: true})

        const pageWithoutFavicon = Brave.server.url('page_favicon_not_found.html')

        yield this.app.client
          .tabByUrl(Brave.newTabUrl)
          .url(pageWithoutFavicon)
          .waitForUrl(pageWithoutFavicon)
          .windowParentByUrl(pageWithoutFavicon)

        yield reloadNewTab(this.app.client)

        yield this.app.client
          .waitForVisible('.topSitesElementFavicon')
          .waitForTextValue('.topSitesElementFavicon', 'F')
      })
    })
  })
})
