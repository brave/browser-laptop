/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
require('../../../braveUnit')

describe('tabContentReducer', function () {
  let tabContentReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    tabContentReducer = require('../../../../../app/renderer/reducers/tabContentReducer')
  })

  after(function () {
    mockery.disable()
  })
  describe('WINDOW_SET_TAB_CONTENT_INTERSECTION_STATE', function () {
    const frameKey = 1
    const originalRatio = 0.7
    const newRatio = 1337

    before(function () {
      this.action = Immutable.fromJS({
        actionType: windowConstants.WINDOW_SET_TAB_CONTENT_INTERSECTION_STATE,
        frameKey: frameKey,
        ratio: originalRatio
      })
      this.state = Immutable.fromJS({
        frames: [{
          key: frameKey,
          location: 'http://clifton-loves-the-kaisen-philosophy.com'
        }],
        ui: { tabs: { intersectionRatio: originalRatio } }
      })
    })

    it('sets the intersection ratio if current tab is the first in the first tabPage', function () {
      this.action = this.action.set('ratio', newRatio)
      this.newState = tabContentReducer(this.state, this.action)
      const result = this.newState.getIn(['ui', 'tabs', 'intersectionRatio'])
      assert.equal(result, newRatio)
    })

    it('does not set the intersection if current tab is not the first in a tab page', function () {
      this.action = this.action.set('ratio', newRatio)
      this.state = this.state.mergeIn(['frames', 0], {
        key: 2,
        location: 'something'
      })
      this.newState = tabContentReducer(this.state, this.action)
      const result = this.newState.getIn(['ui', 'tabs', 'intersectionRatio'])
      assert.equal(result, originalRatio)
    })
  })
})
