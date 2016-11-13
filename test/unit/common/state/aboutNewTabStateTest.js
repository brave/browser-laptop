/* global describe, it */
const aboutNewTabState = require('../../../../app/common/state/aboutNewTabState')
const Immutable = require('immutable')
const assert = require('assert')
const siteTags = require('../../../../js/constants/siteTags')

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
      location: 'https://example1.com/',
      title: 'sample 1',
      parentFolderId: 0,
      count: 10
    })
    const site2 = Immutable.fromJS({
      location: 'https://example2.com',
      title: 'sample 2',
      parentFolderId: 0,
      count: 5
    })
    const site3 = Immutable.fromJS({
      location: 'https://example3.com',
      title: 'sample 3',
      parentFolderId: 0,
      count: 23
    })
    const site4 = Immutable.fromJS({
      location: 'https://example4.com',
      title: 'sample 4',
      parentFolderId: 0,
      count: 0
    })
    const folder1 = Immutable.fromJS({
      customTitle: 'folder1',
      parentFolderId: 0,
      tags: [siteTags.BOOKMARK_FOLDER]
    })
    it('returns a list of the top sites', function () {
      const stateWithSites = defaultAppState.set('sites',
        Immutable.List().push(site1).push(site2).push(site3).push(folder1))
      let expectedState = stateWithSites.setIn(['about', 'newtab', 'sites'],
        Immutable.List().push(site3).push(site1).push(site2))

      // account for timestamp being updated in results
      const actualState = aboutNewTabState.setSites(stateWithSites)
      const ts = assertTimeUpdated(actualState)
      expectedState = expectedState.setIn(['about', 'newtab', 'updatedStamp'], ts)

      // checks:
      // - sorts by count DESC
      // - no folders included
      assert.deepEqual(actualState.toJS(), expectedState.toJS())
    })
    it('respect position of pinned items', function () {
      let stateWithPinnedSites = defaultAppState.set('sites',
        Immutable.List().push(site1).push(site2).push(site3).push(folder1).push(site4))

      const allPinned = Immutable.fromJS([null, null, site1, null, null, null, null, null, site4])

      stateWithPinnedSites = stateWithPinnedSites.setIn(['about', 'newtab', 'pinnedTopSites'],
        allPinned)
      let expectedState = stateWithPinnedSites.setIn(['about', 'newtab', 'sites'],
        Immutable.List().push(site3).push(site2).push(site1).push(site4))

      // account for timestamp being updated in results
      const actualState = aboutNewTabState.setSites(stateWithPinnedSites)
      const ts = assertTimeUpdated(actualState)
      expectedState = expectedState.setIn(['about', 'newtab', 'updatedStamp'], ts)

      // checks:
      // - pinned item are in their expected order
      // - unpinned items fill the rest of the spots (starting w/ highest # visits first)
      assert.deepEqual(actualState.toJS(), expectedState.toJS())
    })
    it('only returns `maxSites` results', function () {
      const maxSites = aboutNewTabState.maxSites
      let tooManySites = Immutable.List()
      for (let i = 0; i < maxSites + 1; i++) {
        tooManySites = tooManySites.push(
            site1.set('location', 'https://example' + i + '.com').set('title', 'sample ' + i))
      }
      const stateWithTooManySites = defaultAppState.set('sites', tooManySites)
      const actualState = aboutNewTabState.setSites(stateWithTooManySites)
      assert.equal(actualState.getIn(['about', 'newtab', 'sites']).size, maxSites)
    })

    it('does not include items marked as ignored', function () {
      let stateWithIgnoredSites = defaultAppState.set('sites',
        Immutable.List().push(site1).push(site2).push(site3).push(site4))

      const ignoredSites = Immutable.List().push(site1).push(site3)
      stateWithIgnoredSites = stateWithIgnoredSites.setIn(['about', 'newtab', 'ignoredTopSites'], ignoredSites)

      let expectedState = stateWithIgnoredSites.setIn(['about', 'newtab', 'sites'],
        Immutable.List().push(site2).push(site4))

      // account for timestamp being updated in results
      const actualState = aboutNewTabState.setSites(stateWithIgnoredSites)
      const ts = assertTimeUpdated(actualState)
      expectedState = expectedState.setIn(['about', 'newtab', 'updatedStamp'], ts)

      // checks:
      // - ignored items are not included
      assert.deepEqual(actualState.toJS(), expectedState.toJS())
    })
    // TODO(bsclifton): test de-duping
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
