/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('updatesReducer', function () {
  let updatesReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    updatesReducer = require('../../../../../app/browser/reducers/updatesReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_UPDATE_LOG_OPENED', function () {
    before(function () {
      this.openItemSpy = sinon.spy(fakeElectron.shell, 'openItem')
      this.getPathMock = sinon.mock(fakeElectron.app, 'getPath', () => '')
      // Make sure updatesReducer doesn't update state when text is updated
      this.newState = updatesReducer(Immutable.Map(), {actionType: appConstants.APP_UPDATE_LOG_OPENED})
    })
    after(function () {
      this.openItemSpy.restore()
      this.getPathMock.restore()
    })
    it('Does not modify state', function () {
      assert(this.newState.isEmpty())
    })
    it('Opens update log path', function () {
      assert(this.openItemSpy.calledOnce)
      assert(this.openItemSpy.args[0][0].endsWith('updateLog.log'))
    })
  })
})
