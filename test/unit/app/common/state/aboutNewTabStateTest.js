/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */
const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
const {aboutNewTabMaxEntries} = require('../../../../../app/browser/api/topSites')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const defaultAppState = Immutable.fromJS({
  about: {
    newtab: {
      gridLayoutSize: 'large',
      sites: [],
      ignoredTopSites: [],
      pinnedTopSites: [],
      updatedStamp: 0
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
  assert.equal(updatedStamp, 0)
}

describe('aboutNewTabState unit test', function () {
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

    it('prevents pinnedTopSites from being duplicated while keeping empty spaces', function () {
      const action = {newTabPageDetail: {}}
      const fakePinnedSites = [
        {location: 'https://cliftonforthecliftonthrone.com'},
        {location: 'https://cliftonforthecliftonthrone.com'},
        undefined,
        {location: 'https://ichoosearizona.com'}
      ]

      const badState = defaultAppState.mergeIn(
        ['about', 'newtab', 'pinnedTopSites'],
        fakePinnedSites
      )

      const state = aboutNewTabState.mergeDetails(badState, action)
      const updatedValue = state.getIn(['about', 'newtab', 'pinnedTopSites'])
      const expectedDedupedValue = [
        {location: 'https://cliftonforthecliftonthrone.com'},
        null,
        null,
        {location: 'https://ichoosearizona.com'}
      ]

      // ensure other entries are filled up as well in the expected result
      const nullArray = []
      for (let i = 0; i < (aboutNewTabMaxEntries - expectedDedupedValue.length); i++) {
        nullArray.push(null)
      }
      const expectedValue = expectedDedupedValue.concat(nullArray)

      assert.deepEqual(JSON.stringify(updatedValue), JSON.stringify(expectedValue))
    })
  })

  describe('clearTopSites', function () {
    before(function () {
      this.clock = sinon.useFakeTimers()
      this.clock.tick(0)
    })

    after(function () {
      this.clock.restore()
    })

    it('is cleared', function () {
      const state = defaultAppState.setIn(['about', 'newtab', 'sites'], Immutable.fromJS([
        {
          location: 'https://brave.com'
        }
      ]))
      const topSItes = aboutNewTabState.clearTopSites(state)
      assert.deepEqual(topSItes.toJS(), defaultAppState.toJS())
    })
  })
})
