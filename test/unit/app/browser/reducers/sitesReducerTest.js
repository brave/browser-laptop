/* global describe, it, before, after */
const Immutable = require('immutable')
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')

const appConstants = require('../../../../../js/constants/appConstants')
const siteTags = require('../../../../../js/constants/siteTags')
const { makeImmutable } = require('../../../../../app/common/state/immutableUtil')
require('../../../braveUnit')

const initState = Immutable.fromJS({
  sites: {},
  windows: [],
  tabs: []
})

/**
 * Most of the site related tests are in siteUtilTest.
 * This just tests that things are hooked up to siteUtil properly.
 */
describe('sitesReducerTest', function () {
  let sitesReducer
  before(function () {
    this.fakeFiltering = {
      clearHistory: () => {}
    }
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../filtering', this.fakeFiltering)
    sitesReducer = require('../../../../../app/browser/reducers/sitesReducer')
  })

  after(function () {
  })

  describe('APP_ON_CLEAR_BROWSING_DATA', function () {
    before(function () {
      this.action = {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      }
      const newState = initState.setIn(['clearBrowsingDataDefaults', 'browserHistory'], true)
      this.clearHistory = sinon.stub(this.fakeFiltering, 'clearHistory')
      this.state = sitesReducer(newState, this.action, makeImmutable(this.action))
    })

    after(function () {
      this.clearHistory.restore()
    })

    it('calls `filtering.clearHistory`', function () {
      assert.ok(this.clearHistory.calledOnce)
    })
  })

  describe('APP_ADD_SITE', function () {
    it('adds a single site to sites map', function () {
      const url = 'https://www.brave.com'
      const state = initState
      const action = {
        actionType: appConstants.APP_ADD_SITE,
        siteDetail: Immutable.fromJS({
          location: url,
          tag: siteTags.BOOKMARK
        }),
        skipSync: true
      }
      const newState = sitesReducer(state, action).toJS()
      assert.equal(Object.keys(newState.sites).length, 1)
      assert.equal(Object.values(newState.sites)[0].location, url)
    })
    it('adds multiple site to sites map', function () {
      const url = 'https://www.brave.com'
      const url2 = 'https://www.brave.com/about'
      const state = initState
      const action = {
        actionType: appConstants.APP_ADD_SITE,
        siteDetail: Immutable.fromJS([{
          location: url,
          tag: siteTags.BOOKMARK
        }, {
          location: url2,
          tag: siteTags.BOOKMARK
        }]),
        skipSync: true
      }
      const newState = sitesReducer(state, action).toJS()
      assert.equal(Object.keys(newState.sites).length, 2)
      assert.equal(Object.values(newState.sites)[0].location, url)
      assert.equal(Object.values(newState.sites)[1].location, url2)
    })
  })
  describe('APP_REMOVE_SITE', function () {
    it('Removes the specified site', function () {
      const url = 'https://www.brave.com'
      let state = initState
      let action = {
        actionType: appConstants.APP_ADD_SITE,
        siteDetail: Immutable.fromJS({
          location: url
        }),
        skipSync: true
      }
      let newState = sitesReducer(state, action)
      action.actionType = appConstants.APP_REMOVE_SITE
      newState = sitesReducer(newState, action).toJS()
      assert.equal(Object.keys(newState.sites).length, 0)
    })
  })
  describe('APP_MOVE_SITE', function () {
    it('Moves the specified site', function () {
      const url = 'https://www.brave.com'
      const url2 = 'https://www.brave.com/3'
      let state = initState
      let addAction = {
        actionType: appConstants.APP_ADD_SITE,
        siteDetail: Immutable.fromJS({
          location: url,
          order: 1
        }),
        skipSync: true
      }

      let moveAction = {
        actionType: appConstants.APP_MOVE_SITE,
        sourceKey: `${url}|0|0`,
        destinationKey: `${url2}|0|0`
      }

      // Sites will be sorted after each site operation. ex. sites[0] will be
      // order 0, sites[1] will be order 1, ...etc.

      // Add sites
      let newState = sitesReducer(state, addAction)
      addAction.siteDetail = addAction.siteDetail.set('location', 'https://www.brave.com/2')
      newState = sitesReducer(newState, addAction)
      addAction.siteDetail = addAction.siteDetail.set('location', 'https://www.brave.com/3')
      newState = sitesReducer(newState, addAction)
      assert.equal(Object.keys(newState.get('sites').toJS()).length, 3)

      // Move the site to the 2nd position
      newState = sitesReducer(newState, moveAction).toJS()
      assert.equal(Object.keys(newState.sites).length, 3)
      assert.equal(Object.values(newState.sites)[2].location, url)
      assert.equal(Object.values(newState.sites)[2].order, 2)

      // Move the site to the 3rd position
      moveAction.prepend = true
      newState = sitesReducer(Immutable.fromJS(newState), moveAction).toJS()
      assert.equal(Object.keys(newState.sites).length, 3)
      assert.equal(Object.values(newState.sites)[1].location, url)
      assert.equal(Object.values(newState.sites)[1].order, 1)
    })
  })

  describe('APP_ADD_BOOKMARK', function () {
    it('site details is null', function () {
      const state = initState
      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result, state)
    })

    it('add a bookmark, but tag is missing', function () {
      const state = initState
      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.com'
        })
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result, state)
    })

    it('add a bookmark', function () {
      const state = initState
      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.com'
        }),
        tag: siteTags.BOOKMARK
      }

      const newSites = {
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newSites)
    })

    it('add a bookmark folder', function () {
      const state = initState

      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave folder'
        }),
        tag: siteTags.BOOKMARK_FOLDER
      }

      const newSites = {
        '1': {
          folderId: 1,
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK_FOLDER],
          objectId: undefined,
          title: 'Brave folder',
          order: 0,
          parentFolderId: 0
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newSites)
    })

    it('add a bookmark with a close bookmark', function () {
      const state = initState.set('sites', makeImmutable({
        'https://www.clifton.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.bbondy.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 1,
          location: 'https://www.bbondy.io',
          parentFolderId: 0
        },
        'https://www.bridiver.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 2,
          location: 'https://www.bridiver.io',
          parentFolderId: 0
        }
      }))

      const action = {
        actionType: appConstants.APP_ADD_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.com'
        }),
        tag: siteTags.BOOKMARK,
        closestKey: 'https://www.bbondy.io|0|0'
      }

      const newSites = {
        'https://www.clifton.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.bbondy.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 1,
          location: 'https://www.bbondy.io',
          parentFolderId: 0
        },
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 2,
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.bridiver.io|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 3,
          location: 'https://www.bridiver.io',
          parentFolderId: 0
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newSites)
    })
  })

  describe('APP_EDIT_BOOKMARK', function () {
    it('site details is null', function () {
      const state = initState
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK
      }

      const newState = sitesReducer(state, action)
      assert.deepEqual(state, newState)
    })

    it('edit a bookmark, but tag is missing', function () {
      const state = initState
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.com'
        })
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result, state)
    })

    it('edit a bookmark, but editKey is missing (title changes)', function () {
      const state = initState.set('sites', makeImmutable({
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        }
      }))
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave 12',
          location: 'https://www.brave.com'
        }),
        tag: siteTags.BOOKMARK
      }

      const newState = {
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave 12',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newState)
    })

    it('edit a bookmark, but editKey is missing (location changes)', function () {
      const state = initState.set('sites', makeImmutable({
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        }
      }))
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 0,
          title: 'Brave',
          location: 'https://www.brave.si'
        }),
        tag: siteTags.BOOKMARK
      }

      const newState = {
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        },
        'https://www.brave.si|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 1,
          location: 'https://www.brave.si',
          parentFolderId: 0
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newState)
    })

    it('edit a bookmark', function () {
      const state = initState.set('sites', makeImmutable({
        'https://www.brave.com|0|0': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          location: 'https://www.brave.com',
          parentFolderId: 0
        }
      }))
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 1,
          title: 'Brave yes',
          location: 'https://www.brave.si'
        }),
        editKey: 'https://www.brave.com|0|0',
        tag: siteTags.BOOKMARK
      }

      const newState = {
        'https://www.brave.si|0|1': {
          lastAccessedTime: 0,
          tags: [siteTags.BOOKMARK],
          objectId: undefined,
          title: 'Brave yes',
          order: 0,
          location: 'https://www.brave.si',
          parentFolderId: 1
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newState)
    })

    it('edit a bookmark folder, but folderId is missing', function () {
      const state = initState.set('sites', makeImmutable({
        '1': {
          lastAccessedTime: 0,
          folderId: 1,
          tags: [siteTags.BOOKMARK_FOLDER],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          parentFolderId: 0
        }
      }))
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          parentFolderId: 1,
          title: 'Brave yes'
        }),
        editKey: '1',
        tag: siteTags.BOOKMARK_FOLDER
      }

      const newState = {
        '2': {
          lastAccessedTime: 0,
          folderId: 2,
          tags: [siteTags.BOOKMARK_FOLDER],
          objectId: undefined,
          title: 'Brave yes',
          order: 0,
          parentFolderId: 1
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newState)
    })

    it('edit a bookmark folder', function () {
      const state = initState.set('sites', makeImmutable({
        '1': {
          lastAccessedTime: 0,
          folderId: 1,
          tags: [siteTags.BOOKMARK_FOLDER],
          objectId: undefined,
          title: 'Brave',
          order: 0,
          parentFolderId: 0
        }
      }))
      const action = {
        actionType: appConstants.APP_EDIT_BOOKMARK,
        siteDetail: makeImmutable({
          folderId: 1,
          parentFolderId: 1,
          title: 'Brave yes'
        }),
        editKey: '1',
        tag: siteTags.BOOKMARK_FOLDER
      }

      const newState = {
        '1': {
          lastAccessedTime: 0,
          folderId: 1,
          tags: [siteTags.BOOKMARK_FOLDER],
          objectId: undefined,
          title: 'Brave yes',
          order: 0,
          parentFolderId: 1
        }
      }

      const result = sitesReducer(state, action)
      assert.deepEqual(result.get('sites').toJS(), newState)
    })
  })
})
