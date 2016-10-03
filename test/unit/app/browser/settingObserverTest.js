/* global describe, it, before, after, beforeEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')

require('../../braveUnit')

describe('setting observer unit test', function () {
  let appActions
  let settingObserver
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../lib/fakeElectron'))
    process.type = 'browser'
    appActions = require('../../../../js/actions/appActions')
    settingObserver = require('../../../../app/browser/settingObserver')
    settingObserver.init()
  })

  beforeEach(function () {
    appActions.setState(Immutable.fromJS({}))
  })

  after(function () {
    mockery.disable()
  })

  it('observes setting changes and unregisters', function (cb) {
    const prefKey = 'test.pref'
    const prefValue = 'value1'
    assert.equal(settingObserver.getWatchedPrefCount(), 0)
    const unregister = settingObserver.registerForPref(prefKey, (pref, val) => {
      assert.equal(prefKey, pref)
      assert.equal(prefValue, val)
      unregister()
      assert.equal(settingObserver.getWatchedPrefCount(), 0)
      cb()
    })
    assert.equal(settingObserver.getWatchedPrefCount(), 1)
    appActions.changeSetting(prefKey, 'value1')
  })
})
