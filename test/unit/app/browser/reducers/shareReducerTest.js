/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('shareReducer', function () {
  let shareReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    this.shareStub = {
      simpleShareActiveTab: sinon.stub()
    }
    mockery.registerMock('../share', this.shareStub)
    shareReducer = require('../../../../../app/browser/reducers/shareReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SIMPLE_SHARE_ACTIVE_TAB_REQUESTED', function () {
    before(function () {
      this.state = Immutable.Map()
      this.windowId = 2
      this.shareType = 'email'
      this.newState = shareReducer(this.state, {actionType: appConstants.APP_SIMPLE_SHARE_ACTIVE_TAB_REQUESTED, windowId: this.windowId, shareType: this.shareType})
    })
    it('calls simpleShareActiveTab once with the correct args', function () {
      const callCount = this.shareStub.simpleShareActiveTab.withArgs(this.state, this.windowId, this.shareType).callCount
      assert.equal(callCount, 1)
    })
  })
})
