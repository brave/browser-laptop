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
      emailActiveTab: sinon.stub()
    }
    mockery.registerMock('../share', this.shareStub)
    shareReducer = require('../../../../../app/browser/reducers/shareReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_EMAIL_ACTIVE_TAB_REQUESTED', function () {
    before(function () {
      this.state = Immutable.Map()
      this.windowId = 2
      this.newState = shareReducer(this.state, {actionType: appConstants.APP_EMAIL_ACTIVE_TAB_REQUESTED, windowId: this.windowId})
    })
    it('calls emailActiveTab once with the correct args', function () {
      const callCount = this.shareStub.emailActiveTab.withArgs(this.state, this.windowId).callCount
      assert.equal(callCount, 1)
    })
  })
})
