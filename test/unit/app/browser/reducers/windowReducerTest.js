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

  describe('APP_WINDOW_CREATED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('check if functions are called', function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
      windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_CREATED,
        windowValue: Immutable.fromJS({
          windowId: 1
        })
      })
      assert.equal(spy.calledOnce, true)
    })
  })

  describe('APP_WINDOW_RESIZED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('check if functions are called', function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
      windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_RESIZED,
        windowValue: Immutable.fromJS({
          windowId: 1
        })
      })
      assert.equal(spy.calledOnce, true)
    })
  })
})
