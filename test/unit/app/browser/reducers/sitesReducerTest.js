/* global describe, it, before, after */
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
const siteTags = require('../../../../../js/constants/siteTags')
require('../../../braveUnit')

const initState = Immutable.fromJS({
  sites: {}
})

/**
 * Most of the site related tests are in siteUtilTest.
 * This just tests that things are hooked up to siteUtil properly.
 */
describe('sitesReducerTest', function () {
  let sitesReducer
  before(function () {
    sitesReducer = require('../../../../../app/browser/reducers/sitesReducer')
  })

  after(function () {
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
      assert.equal(Object.keys(newState.sites).length, 1)
      assert.equal(Object.keys(newState.sites)[0].lastAccessedTime, undefined)
    })
  })
  describe('APP_MOVE_SITE', function () {
    it('Moves the specified site', function () {
      const url = 'https://www.brave.com'
      let state = initState
      let action = {
        actionType: appConstants.APP_ADD_SITE,
        siteDetail: Immutable.fromJS({
          location: url,
          order: 1
        }),
        skipSync: true
      }
      let newState = sitesReducer(state, action)
      action.siteDetail = action.siteDetail.set('location', 'https://www.brave.com/2')
      newState = sitesReducer(newState, action)
      action.siteDetail = action.siteDetail.set('location', 'https://www.brave.com/3')
      newState = sitesReducer(newState, action)
      assert.equal(Object.keys(newState.get('sites').toJS()).length, 3)

      // Move the site to the 2nd position
      action.actionType = appConstants.APP_MOVE_SITE
      action.sourceDetail = action.siteDetail
      action.destinationDetail = action.siteDetail.set('location', 'https://www.brave.com')
      action.siteDetail = undefined
      newState = sitesReducer(newState, action).toJS()
      assert.equal(Object.keys(newState.sites).length, 3)
      assert.equal(Object.values(newState.sites)[2].location, 'https://www.brave.com/3')
      assert.equal(Object.values(newState.sites)[2].order, 1)

      // Move the site to the 3rd position
      action.prepend = true
      newState = sitesReducer(Immutable.fromJS(newState), action).toJS()
      assert.equal(Object.keys(newState.sites).length, 3)
      assert.equal(Object.values(newState.sites)[2].location, 'https://www.brave.com/3')
      assert.equal(Object.values(newState.sites)[2].order, 0)
    })
  })
})
