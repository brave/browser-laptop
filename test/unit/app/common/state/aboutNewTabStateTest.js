/* global describe, it */
const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
const Immutable = require('immutable')
const assert = require('assert')

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
    it('updates the `updatedStamp` value on success', function () {
      const topSites = Immutable.fromJS([site1, site2, site3])
      const state = aboutNewTabState.setSites(defaultAppState, topSites)
      assertTimeUpdated(state)
    })

    it('does not update state or `updatedStamp` if input is falsey', function () {
      const state = aboutNewTabState.setSites(defaultAppState, null)
      assertNoChange(state)
    })

    it('sets the provided data for top sites', function () {
      const topSites = Immutable.fromJS([site1, site2, site3])
      const state = aboutNewTabState.setSites(defaultAppState, topSites)
      const updatedValue = state.getIn(['about', 'newtab', 'sites'])
      assert.deepEqual(updatedValue.toJS(), topSites.toJS())
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
