/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeAdBlock = require('../../../lib/fakeAdBlock')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('windowsReducer unit test', function () {
  let windowsReducer
  const fakeElectron = Object.assign({}, require('../../../lib/fakeElectron'))

  const fakeWindowState = {
    maybeCreateWindow: (state, action) => state
  }

  const state = Immutable.fromJS({
    windows: [],
    defaultWindowParams: {}
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../common/state/windowState', fakeWindowState)
    windowsReducer = require('../../../../../app/browser/reducers/windowsReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_WINDOW_UPDATED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(state.getIn(['defaultWindowParams']).toJS(), newState.getIn(['defaultWindowParams']).toJS())
    })

    it('updateDefault is false (we shouldnt update it)', function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED,
        updateDefault: false
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(state.getIn(['defaultWindowParams']).toJS(), newState.getIn(['defaultWindowParams']).toJS())
    })

    it('updateDefault is true', function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED,
        updateDefault: true,
        windowValue: {
          width: 1,
          height: 2,
          x: 3,
          y: 4,
          state: 'maximized'
        }
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual({
        width: 1,
        height: 2,
        x: 3,
        y: 4,
        maximized: true
      }, newState.getIn(['defaultWindowParams']).toJS())
    })
  })
})
