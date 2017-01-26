/* global describe, it */
const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
const Immutable = require('immutable')
const assert = require('assert')
const siteTags = require('../../../../../js/constants/siteTags')

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

const arbitraryTimeInThePast = 1450000000000

const assertTimeUpdated = (state) => {
  const updatedStamp = state.getIn(['about', 'newtab', 'updatedStamp'])
  assert.equal(typeof updatedStamp === 'number' && updatedStamp > arbitraryTimeInThePast, true)
  return updatedStamp
}

const assertNoChange = (state) => {
  const updatedStamp = state.getIn(['about', 'newtab', 'updatedStamp'])
  assert.deepEqual(state, defaultAppState)
  assert.equal(updatedStamp, undefined)
}

describe('aboutNewTabState', function () {
  describe('getSites', function () {
    it('returns the contents of about.newtab.sites', function () {
      const expectedSites = Immutable.List().push(1).push(2).push(3)
      const stateWithSites = defaultAppState.setIn(['about', 'newtab', 'sites'], expectedSites)
      const actualSites = aboutNewTabState.getSites(stateWithSites)
      assert.deepEqual(actualSites.toJS(), expectedSites.toJS())
    })
  })

  describe('setSites', function () {
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
        const actualState = aboutNewTabState.setSites(stateWithSites)
        assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
      })

      it('does not include imported bookmarks (lastAccessedTime === 0)', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(importedBookmark1))
        const expectedSites = Immutable.List().push(site1)
        const actualState = aboutNewTabState.setSites(stateWithSites)
        assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
      })

      it('sorts results by `count` DESC', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(site2).push(site3).push(site4))
        const expectedSites = Immutable.List().push(site3).push(site1).push(site2).push(site4)
        const actualState = aboutNewTabState.setSites(stateWithSites)
        assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
      })

      it('sorts results by `lastAccessedTime` DESC if `count` is the same', function () {
        const stateWithSites = defaultAppState.set('sites',
          Immutable.List().push(site1).push(site3).push(site5))
        const expectedSites = Immutable.List().push(site5).push(site3).push(site1)
        const actualState = aboutNewTabState.setSites(stateWithSites)
        assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
      })

      it('only returns the last `maxSites` results', function () {
        const maxSites = aboutNewTabState.maxSites
        let tooManySites = Immutable.List()
        for (let i = 0; i < maxSites + 1; i++) {
          tooManySites = tooManySites.push(
            site1.set('location', 'https://example' + i + '.com')
              .set('title', 'sample ' + i)
              .set('count', i))
        }
        const stateWithTooManySites = defaultAppState.set('sites', tooManySites)
        const actualState = aboutNewTabState.setSites(stateWithTooManySites)
        const actualSites = actualState.getIn(['about', 'newtab', 'sites'])
        assert.equal(actualSites.size, maxSites)
        assert.equal(actualSites.getIn([0, 'title']), 'sample ' + aboutNewTabState.maxSites)
      })

      it('does not include items marked as ignored', function () {
        const ignoredSites = Immutable.List().push(site1).push(site3)
        const stateWithIgnoredSites = defaultAppState
          .set('sites', Immutable.List().push(site1).push(site2).push(site3).push(site4))
          .setIn(['about', 'newtab', 'ignoredTopSites'], ignoredSites)
        const expectedState = Immutable.List().push(site2).push(site4)
        const actualState = aboutNewTabState.setSites(stateWithIgnoredSites)
        assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedState.toJS())
      })
    })

    it('respects position of pinned items when populating results', function () {
      const allPinned = Immutable.fromJS([null, null, site1, null, null, null, null, null, site4])
      const stateWithPinnedSites = defaultAppState
        .set('sites', Immutable.List().push(site1).push(site2).push(site3).push(folder1).push(site4))
        .setIn(['about', 'newtab', 'pinnedTopSites'], allPinned)
      const expectedSites = Immutable.List().push(site3).push(site2).push(site1).push(site4)
      const actualState = aboutNewTabState.setSites(stateWithPinnedSites)
      // checks:
      // - pinned item are in their expected order
      // - unpinned items fill the rest of the spots (starting w/ highest # visits first)
      assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
    })

    it('only includes one result for a domain (the one with the highest count)', function () {
      const stateWithDuplicateDomains = defaultAppState.set('sites', Immutable.List()
        .push(site1.set('location', 'https://example1.com/test').set('count', 12))
        .push(site1.set('location', 'https://example1.com/about').set('count', 7)))
      const expectedSites = Immutable.List().push(site1.set('location', 'https://example1.com/test').set('count', 12))
      const actualState = aboutNewTabState.setSites(stateWithDuplicateDomains)
      assert.deepEqual(actualState.getIn(['about', 'newtab', 'sites']).toJS(), expectedSites.toJS())
    })
  })

  describe('mergeDetails', function () {
    it('updates the `updatedStamp` value on success', function () {
      const action = {newTabPageDetail: {}}
      const state = aboutNewTabState.mergeDetails(defaultAppState, action)
      assertTimeUpdated(state)
    })

    it('does not update state or `updatedStamp` if input is falsey', function () {
      const state = aboutNewTabState.mergeDetails(defaultAppState, null)
      assertNoChange(state)
    })

    it('merges the provided data into about.newtab', function () {
      const action = {newTabPageDetail: {testing123: 'TEST STRING'}}
      const state = aboutNewTabState.mergeDetails(defaultAppState, action)
      const updatedValue = state.getIn(['about', 'newtab', 'testing123'])
      assert.equal(updatedValue, 'TEST STRING')
    })
  })
})
