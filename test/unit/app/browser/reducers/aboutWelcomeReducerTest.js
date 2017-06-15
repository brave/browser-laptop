/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const appConstants = require('../../../../../js/constants/appConstants')
const fakeElectron = require('../../../lib/fakeElectron')

require('../../../braveUnit')

describe('aboutWelcomeReducer', function () {
  let aboutWelcomeReducer

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    aboutWelcomeReducer = require('../../../../../app/browser/reducers/aboutWelcomeReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_ACTIVATE_WELCOME_SCREEN', function () {
    before(function () {
      this.newState = aboutWelcomeReducer(Immutable.Map(), {
        actionType: appConstants.APP_ACTIVATE_WELCOME_SCREEN,
        activateWelcomeScreen: false
      })
    })
    it('can set visibility state to false', function () {
      assert.equal(this.newState.getIn(['about', 'welcome', 'showOnLoad']), false)
    })
  })
})
