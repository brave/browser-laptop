/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, afterEach, before */
const Immutable = require('immutable')
const assert = require('assert')
const siteTags = require('../../../../../js/constants/siteTags')
const sinon = require('sinon')
const mockery = require('mockery')

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
      location: 'https://example1.com/', title: 'sample 1', parentFolderId: 0, count: 10
    })
    const site2 = Immutable.fromJS({
      location: 'https://example2.com', title: 'sample 2', parentFolderId: 0, count: 5
    })
    const site3 = Immutable.fromJS({
      location: 'https://example3.com', title: 'sample 3', parentFolderId: 0, count: 23, lastAccessedTime: 123
    })
    const site4 = Immutable.fromJS({
      location: 'https://example4.com', title: 'sample 4', parentFolderId: 0, count: 0
    })
    const site5 = Immutable.fromJS({
      location: 'https://example4.com', title: 'sample 5', parentFolderId: 0, count: 23, lastAccessedTime: 456
    })
    const importedBookmark1 = Immutable.fromJS({
      location: 'https://example6.com', title: 'sample 6', parentFolderId: 0, count: 23, lastAccessedTime: 0
    })
    const folder1 = Immutable.fromJS({
      customTitle: 'folder1', parentFolderId: 0, tags: [siteTags.BOOKMARK_FOLDER]
    })

    describe('when fetching unpinned results', function () {
      it('does not include bookmark folders', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(folder1))
        const expectedSites = Immutable.List().push(site1)
        getStateValue = stateWithSites
        this.topSites.calculateTopSites(true)
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
      })

      it('does not include imported bookmarks (lastAccessedTime === 0)', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(importedBookmark1))
        const expectedSites = Immutable.List().push(site1)
        this.topSites.calculateTopSites(stateWithSites)
        getStateValue = stateWithSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
      })

      it('sorts results by `count` DESC', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(site2).push(site3).push(site4))
        const expectedSites = Immutable.List().push(site3).push(site1).push(site2).push(site4)
        this.topSites.calculateTopSites(stateWithSites)
        getStateValue = stateWithSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
      })

      it('sorts results by `lastAccessedTime` DESC if `count` is the same', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(site3).push(site5))
        const expectedSites = Immutable.List().push(site5).push(site3).push(site1)
        this.topSites.calculateTopSites(stateWithSites)
        getStateValue = stateWithSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
      })

      it('only returns the last `maxSites` results', function () {
        const maxSites = this.topSites.aboutNewTabMaxEntries
        let tooManySites = Immutable.List()
        for (let i = 0; i < maxSites + 1; i++) {
          tooManySites = tooManySites.push(
            site1.set('location', 'https://example' + i + '.com')
              .set('title', 'sample ' + i)
              .set('count', i))
        }
        const stateWithTooManySites = defaultAppState.set('sites', tooManySites)
        this.topSites.calculateTopSites(stateWithTooManySites)

        getStateValue = stateWithTooManySites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.equal(newSitesData.size, maxSites)
        assert.equal(newSitesData.getIn([0, 'title']), 'sample ' + this.topSites.aboutNewTabMaxEntries)
      })

      it('does not include items marked as ignored', function () {
        const ignoredSites = Immutable.List().push(site1).push(site3)
        const stateWithIgnoredSites = defaultAppState
          .set('sites', Immutable.List().push(site1).push(site2).push(site3).push(site4))
          .setIn(['about', 'newtab', 'ignoredTopSites'], ignoredSites)
        const expectedSites = Immutable.List().push(site2).push(site4)
        this.topSites.calculateTopSites(stateWithIgnoredSites)
        getStateValue = stateWithIgnoredSites
        this.clock.tick(calculateTopSitesClockTime)
        assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
        const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
        assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
      })
    })

    it('respects position of pinned items when populating results', function () {
      const allPinned = Immutable.fromJS([null, null, site1, null, null, null, null, null, site4])
      const stateWithPinnedSites = defaultAppState
        .set('sites', Immutable.List().push(site1).push(site2).push(site3).push(folder1).push(site4))
        .setIn(['about', 'newtab', 'pinnedTopSites'], allPinned)
      const expectedSites = Immutable.List().push(site3).push(site2).push(site1).push(site4)
      this.topSites.calculateTopSites(stateWithPinnedSites)
      // checks:
      // - pinned item are in their expected order
      // - unpinned items fill the rest of the spots (starting w/ highest # visits first)
      getStateValue = stateWithPinnedSites
      this.clock.tick(calculateTopSitesClockTime)
      assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
      const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
      assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
    })

    it('only includes one result for a domain (the one with the highest count)', function () {
      const stateWithDuplicateDomains = defaultAppState.set('sites', Immutable.List()
        .push(site1.set('location', 'https://example1.com/test').set('count', 12))
        .push(site1.set('location', 'https://example1.com/about').set('count', 7)))
      const expectedSites = Immutable.List().push(site1.set('location', 'https://example1.com/test').set('count', 12))
      this.topSites.calculateTopSites(stateWithDuplicateDomains)
      getStateValue = stateWithDuplicateDomains
      this.clock.tick(calculateTopSitesClockTime)
      assert.equal(this.appActions.topSiteDataAvailable.callCount, 1)
      const newSitesData = this.appActions.topSiteDataAvailable.getCall(0).args[0]
      assert.deepEqual(newSitesData.toJS(), expectedSites.toJS())
    })
  })
})
