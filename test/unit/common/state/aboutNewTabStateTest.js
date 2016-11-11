/* global describe, it */
const aboutNewTabState = require('../../../../app/common/state/aboutNewTabState')
const Immutable = require('immutable')
const assert = require('assert')
const siteTags = require('../../../../js/constants/siteTags')
const siteUtil = require('../../../../js/state/siteUtil')

const defaultAppState = Immutable.fromJS({
  about: {
    newtab: {
      gridLayoutSize: 'large',
      sites: {},
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
}

const assertNoChange = (state) => {
  const updatedStamp = state.getIn(['about', 'newtab', 'updatedStamp'])
  assert.deepEqual(state, defaultAppState)
  assert.equal(updatedStamp, undefined)
}

describe('aboutNewTabState', function () {
  const testTime = 1478213227349
  const bookmarkFolderAction = {
    siteDetail: {
      location: 'https://brave.com',
      tags: [siteTags.BOOKMARK_FOLDER],
      customTitle: 'folder 1',
      parentFolderId: 0,
      folderId: 1,
      lastAccessedTime: testTime
    }
  }
  const aboutPageAction = {
    siteDetail: {
      location: 'about:preferences',
      title: 'preferences',
      lastAccessedTime: testTime
    }
  }
  const bookmarkAction = {
    siteDetail: {
      title: 'Brave',
      location: 'https://brave.com',
      lastAccessedTime: testTime
    },
    tag: siteTags.BOOKMARK
  }
  const historyAction = {
    siteDetail: {
      title: 'Brave',
      location: 'https://brave.com',
      lastAccessedTime: testTime
    },
    tag: undefined
  }

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

  describe('addSite', function () {
    it('updates the `updatedStamp` value on success', function () {
      const state = aboutNewTabState.addSite(defaultAppState, bookmarkAction)
      assertTimeUpdated(state)
    })

    describe('does not update state or `updatedStamp` if input is invalid', function () {
      it('calls with props=falsey', function () {
        const state = aboutNewTabState.addSite(defaultAppState, null)
        assertNoChange(state)
      })

      it('calls with props=bookmark folder', function () {
        const state = aboutNewTabState.addSite(defaultAppState, bookmarkFolderAction)
        assertNoChange(state)
      })

      it('calls with props=about page', function () {
        const state = aboutNewTabState.addSite(defaultAppState, aboutPageAction)
        assertNoChange(state)
      })
    })

    it('adds the entry into the sites list', function () {
      const state = aboutNewTabState.addSite(defaultAppState, bookmarkAction)
      const key = siteUtil.getSiteKey(Immutable.fromJS(bookmarkAction.siteDetail))
      const updatedValue = state.getIn(['about', 'newtab', 'sites', key, 'location'])
      assert.equal(updatedValue, bookmarkAction.siteDetail.location)
    })

    it('will add lastAccessedTime to the siteDetail if missing from history entry', function () {
      const action = {siteDetail: {location: 'https://brave.com'}}
      const state = aboutNewTabState.addSite(defaultAppState, action)
      const key = siteUtil.getSiteKey(Immutable.fromJS(action.siteDetail))
      const updatedValue = state.getIn(['about', 'newtab', 'sites', key, 'lastAccessedTime'])
      assert.equal(typeof updatedValue === 'number' && updatedValue > arbitraryTimeInThePast, true)
    })
  })

  describe('removeSite', function () {
    it('updates the `updatedStamp` value on success', function () {
      const action = {siteDetail: {location: 'https://brave.com', lastAccessedTime: testTime}}
      const state = aboutNewTabState.removeSite(defaultAppState, action)
      assertTimeUpdated(state)
    })

    describe('does not update state or `updatedStamp` if input is invalid', function () {
      it('calls with props=falsey', function () {
        const state = aboutNewTabState.removeSite(defaultAppState, null)
        assertNoChange(state)
      })

      it('calls with props=bookmark folder', function () {
        const state = aboutNewTabState.removeSite(defaultAppState, bookmarkFolderAction)
        assertNoChange(state)
      })

      it('calls with props=about page', function () {
        const state = aboutNewTabState.addSite(defaultAppState, aboutPageAction)
        assertNoChange(state)
      })
    })

    it('removes the entry from the sites list', function () {
      const stateWithSite = aboutNewTabState.addSite(defaultAppState, historyAction)
      assert.equal(stateWithSite.size, 1)

      const state = aboutNewTabState.removeSite(stateWithSite, historyAction)
      const sites = state.getIn(['about', 'newtab', 'sites'])
      assert.equal(sites.size, 0)
    })
  })

  describe('updateSiteFavicon', function () {
    it('updates the `updatedStamp` value on success', function () {
      const action = {frameProps: {location: 'https://brave.com'}, favicon: 'https://brave.com/favicon.ico'}
      const state = aboutNewTabState.updateSiteFavicon(defaultAppState, action)
      assertTimeUpdated(state)
    })

    describe('does not update state or `updatedStamp` if input is invalid', function () {
      it('calls with props=falsey', function () {
        const state = aboutNewTabState.updateSiteFavicon(defaultAppState, null)
        assertNoChange(state)
      })
      it('calls with props.frameProps=null', function () {
        const action = {frameProps: null}
        const state = aboutNewTabState.updateSiteFavicon(defaultAppState, action)
        assertNoChange(state)
      })
      it('calls with props.frameProps.location=null', function () {
        const action = {frameProps: {location: null}}
        const state = aboutNewTabState.updateSiteFavicon(defaultAppState, action)
        assertNoChange(state)
      })
    })

    it('updates the entry into the sites list', function () {
      let state = aboutNewTabState.addSite(defaultAppState, bookmarkAction)
      let key = siteUtil.getSiteKey(Immutable.fromJS(bookmarkAction.siteDetail))
      let favicon = state.getIn(['about', 'newtab', 'sites', key, 'favicon'])
      assert.equal(favicon, undefined)

      const action = {frameProps: {location: 'https://brave.com'}, favicon: 'https://brave.com/favicon.ico'}
      state = aboutNewTabState.updateSiteFavicon(state, action)
      key = siteUtil.getSiteKey(Immutable.fromJS({location: 'https://brave.com'}))
      favicon = state.getIn(['about', 'newtab', 'sites', key, 'favicon'])
      assert.equal(favicon, action.favicon)
    })
  })
})
