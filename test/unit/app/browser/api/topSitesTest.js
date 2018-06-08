/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, afterEach, before */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')
const historyUtil = require('../../../../../app/common/lib/historyUtil')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')

let getStateValue

const defaultAppState = Immutable.fromJS({
  about: {
    newtab: {
      gridLayoutSize: 'large',
      sites: [],
      ignoredTopSites: [],
      pinnedTopSites: [],
      updatedStamp: undefined
    }
  }
})

const calculateTopSitesClockTime = 1000000

const generateMap = (...sites) => {
  let history = Immutable.Map()

  for (let item of sites) {
    history = history.set(historyUtil.getKey(item), item)
  }

  return history
}

describe('topSites api', function () {
  before(function () {
    this.clock = sinon.useFakeTimers()
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../../lib/fakeElectron'))
    mockery.registerMock('ad-block', require('../../../lib/fakeAdBlock'))
    this.appActions = require('../../../../../js/actions/appActions')
    this.appStore = require('../../../../../js/stores/appStore')
    sinon.stub(this.appActions, 'topSiteDataAvailable')
    getStateValue = Immutable.Map()
    sinon.stub(this.appStore, 'getState', () => {
      return getStateValue
    })
    this.topSites = require('../../../../../app/browser/api/topSites')
  })
  after(function () {
    this.appActions.topSiteDataAvailable.restore()
    this.clock.restore()
    mockery.disable()
  })
  afterEach(function () {
    this.appActions.topSiteDataAvailable.reset()
  })
  describe('calculateTopSites', function () {
    const site1 = Immutable.fromJS({
      location: 'https://example1.com/',
      title: 'sample 1',
      parentFolderId: 0,
      count: 10,
      key: 'https://example1.com/|0'
    })
    const site2 = Immutable.fromJS({
      location: 'https://example2.com/',
      title: 'sample 2',
      parentFolderId: 0,
      count: 5,
      key: 'https://example2.com/|0'
    })
    const site3 = Immutable.fromJS({
      location: 'https://example3.com/',
      title: 'sample 3',
      parentFolderId: 0,
      count: 23,
      lastAccessedTime: 123,
      key: 'https://example3.com/|0'
    })
    const site4 = Immutable.fromJS({
      location: 'https://example4.com/',
      title: 'sample 4',
      parentFolderId: 0,
      count: 0,
      key: 'https://example4.com/|0'
    })
    const site5 = Immutable.fromJS({
      location: 'https://example5.com/',
      title: 'sample 5',
      parentFolderId: 0,
      count: 23,
      lastAccessedTime: 456,
      key: 'https://example5.com/|0'
    })

    const staticNewData = Immutable.fromJS([
      { key: 'https://twitter.com/brave/|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/twitter.png',
        location: 'https://twitter.com/brave',
        themeColor: 'rgb(255, 255, 255)',
        title: 'Brave Software (@brave) | Twitter',
        bookmarked: false
      },
      { key: 'https://github.com/brave/|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/github.png',
        location: 'https://github.com/brave/',
        themeColor: 'rgb(255, 255, 255)',
        title: 'Brave Software | GitHub',
        bookmarked: false
      },
      { key: 'https://youtube.com/bravesoftware/|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/youtube.png',
        location: 'https://youtube.com/bravesoftware/',
        themeColor: 'rgb(255, 255, 255)',
        title: 'Brave Browser - YouTube',
        bookmarked: false
      },
      { key: 'https://brave.com/|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/brave.ico',
        location: 'https://brave.com/',
        themeColor: 'rgb(255, 255, 255)',
        title: 'Brave Software | Building a Better Web',
        bookmarked: false
      },
      { key: 'https://itunes.apple.com/app/brave-web-browser/id1052879175?mt=8|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/appstore.png',
        location: 'https://itunes.apple.com/app/brave-web-browser/id1052879175?mt=8',
        themeColor: 'rgba(255, 255, 255, 1)',
        title: 'Brave Web Browser: Fast with built-in adblock on the App Store',
        bookmarked: false
      },
      { key: 'https://play.google.com/store/apps/details?id=com.brave.browser|0',
        count: 0,
        favicon: 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/img/newtab/defaultTopSitesIcon/playstore.png',
        location: 'https://play.google.com/store/apps/details?id=com.brave.browser',
        themeColor: 'rgb(241, 241, 241)',
        title: 'Brave Browser: Fast AdBlocker - Apps on Google Play',
        bookmarked: false
      }
    ])

    it('respects position of pinned items when populating results', function () {
      const allPinned = Immutable.fromJS([null, site2, null, site4])
      let stateWithPinnedSites = defaultAppState
        .set(STATE_SITES.HISTORY_SITES, generateMap(site1, site2, site3, site4))
        .setIn(['about', 'newtab', 'pinnedTopSites'], allPinned)
      this.topSites.calculateTopSites(stateWithPinnedSites)
      // checks:
      // - pinned item are in their expected order (site 2 at i-1 and site4 at i-3)
      // - unpinned items fill the rest of the spots (starting w/ highest # visits first)
      this.topSites.calculateTopSites(stateWithPinnedSites)
      getStateValue = stateWithPinnedSites
      this.clock.tick(calculateTopSitesClockTime)
      assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
      const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]

      // assert that first site is populated
      assert.deepEqual(newSitesData.get(0).isEmpty(), false)
      // assert that site 2 is at i-1 as planned
      assert.deepEqual(newSitesData.get(1), site2)
      // assert that second site is populated
      assert.deepEqual(newSitesData.get(2).isEmpty(), false)
      // assert that site 4 is at i-3 as planned
      assert.deepEqual(newSitesData.get(3), site4)
    })

    it('only includes one result for a domain (the one with the highest count)', function () {
      const stateWithDuplicateDomains = defaultAppState.set(STATE_SITES.HISTORY_SITES, generateMap(
        site1.set('location', 'https://example1.com/test').set('count', 12),
        site1.set('location', 'https://example1.com/about').set('count', 7)))
      this.topSites.calculateTopSites(stateWithDuplicateDomains)
      getStateValue = stateWithDuplicateDomains
      this.clock.tick(calculateTopSitesClockTime)
      assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
      const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
      const expectedSites = Immutable.fromJS([
        {
          location: 'https://example1.com/test',
          title: 'sample 1',
          parentFolderId: 0,
          count: 12,
          bookmarked: false,
          key: 'https://example1.com/test|0'
        }
      ])
      assert.deepEqual(newSitesData.toJS(), expectedSites.concat(staticNewData).toJS())
    })

    describe('when fetching unpinned results', function () {
      it('sorts results by `count` DESC', function () {
        const stateWithSites = defaultAppState.set(STATE_SITES.HISTORY_SITES, generateMap(site1, site2, site3, site4))
        this.topSites.calculateTopSites(stateWithSites)
        getStateValue = stateWithSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        const expectedSites = Immutable.fromJS([
          {
            location: 'https://example3.com/',
            title: 'sample 3',
            parentFolderId: 0,
            count: 23,
            lastAccessedTime: 123,
            bookmarked: false,
            key: 'https://example3.com/|0'
          },
          {
            location: 'https://example1.com/',
            title: 'sample 1',
            parentFolderId: 0,
            count: 10,
            bookmarked: false,
            key: 'https://example1.com/|0'
          },
          {
            location: 'https://example2.com/',
            title: 'sample 2',
            parentFolderId: 0,
            count: 5,
            bookmarked: false,
            key: 'https://example2.com/|0'
          },
          {
            location: 'https://example4.com/',
            title: 'sample 4',
            parentFolderId: 0,
            count: 0,
            bookmarked: false,
            key: 'https://example4.com/|0'
          }
        ])
        assert.deepEqual(newSitesData.toJS(), expectedSites.concat(staticNewData).toJS())
      })

      it('sorts results by `lastAccessedTime` DESC if `count` is the same', function () {
        const stateWithSites = defaultAppState.set(STATE_SITES.HISTORY_SITES, generateMap(site1, site3, site5))
        this.topSites.calculateTopSites(stateWithSites)
        getStateValue = stateWithSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        const expectedSites = Immutable.fromJS([
          {
            location: 'https://example5.com/',
            title: 'sample 5',
            parentFolderId: 0,
            count: 23,
            lastAccessedTime: 456,
            bookmarked: false,
            key: 'https://example5.com/|0'
          },
          {
            location: 'https://example3.com/',
            title: 'sample 3',
            parentFolderId: 0,
            count: 23,
            bookmarked: false,
            key: 'https://example3.com/|0',
            lastAccessedTime: 123
          },
          {
            location: 'https://example1.com/',
            title: 'sample 1',
            parentFolderId: 0,
            count: 10,
            bookmarked: false,
            key: 'https://example1.com/|0'
          }
        ])
        assert.deepEqual(newSitesData.toJS(), expectedSites.concat(staticNewData).toJS())
      })

      it('only returns the last maxSites results', function () {
        const maxSites = this.topSites.aboutNewTabMaxEntries
        let tooManySites = Immutable.Map()
        for (let i = 0; i < maxSites + 1; i++) {
          tooManySites = tooManySites.set('https://example' + i + '.com|0',
            site1.set('location', 'https://example' + i + '.com')
              .set('title', 'sample ' + i)
              .set('count', i)
              .set('bookmarked', false)
          )
        }
        const stateWithTooManySites = defaultAppState.set(STATE_SITES.HISTORY_SITES, tooManySites)
        this.topSites.calculateTopSites(stateWithTooManySites)

        getStateValue = stateWithTooManySites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.equal(newSitesData.size, maxSites)
        assert.equal(newSitesData.getIn([0, 'title']), 'sample ' + this.topSites.aboutNewTabMaxEntries)
      })
    })
  })
})
