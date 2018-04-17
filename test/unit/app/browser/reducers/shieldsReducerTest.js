/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const appActions = require('../../../../../js/actions/appActions')
const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('APP_TOGGLE_SHIELDS', function () {
  let loadURLRequestedSpy
  let changeSiteSettingSpy
  let shieldsReducer

  before(function () {
    loadURLRequestedSpy = sinon.spy(appActions, 'loadURLRequested')
    changeSiteSettingSpy = sinon.spy(appActions, 'changeSiteSetting')
    shieldsReducer = require('../../../../../app/browser/reducers/shieldsReducer')
  })

  afterEach(function () {
    loadURLRequestedSpy.reset()
    changeSiteSettingSpy.reset()
  })

  after(function () {
    loadURLRequestedSpy.restore()
    changeSiteSettingSpy.restore()
  })

  it('succeeds with valid action parameters', function () {
    const initAction = {
      frame: {
        tabId: 123,
        isPrivate: true,
        location: 'https://www.brave.com'
      },
      value: true,
      actionType: appConstants.APP_TOGGLE_SHIELDS
    }
    shieldsReducer(Immutable.Map(), initAction)
    assert.equal(loadURLRequestedSpy.called, true)
    assert.equal(changeSiteSettingSpy.called, true)
  })

  it('toggles the current shield status', function () {
    const initAction = {
      frame: {
        tabId: 123,
        isPrivate: true,
        location: 'https://www.brave.com'
      },
      value: true,
      actionType: appConstants.APP_TOGGLE_SHIELDS
    }
    shieldsReducer(Immutable.Map(), initAction)
    assert.equal(loadURLRequestedSpy.called, true)
    assert.equal(changeSiteSettingSpy.called, true)
  })

  it('takes no action with a null frame', function () {
    const initAction = {
      frame: null,
      value: false,
      actionType: appConstants.APP_TOGGLE_SHIELDS
    }
    shieldsReducer(Immutable.Map(), initAction)
    assert.equal(loadURLRequestedSpy.called, false)
    assert.equal(changeSiteSettingSpy.called, false)
  })

  it('takes no action with a null location', function () {
    const initAction = {
      frame: {
        tabId: 123,
        isPrivate: true,
        location: null
      },
      value: true,
      actionType: appConstants.APP_TOGGLE_SHIELDS
    }
    shieldsReducer(Immutable.Map(), initAction)
    assert.equal(loadURLRequestedSpy.called, false)
    assert.equal(changeSiteSettingSpy.called, false)
  })
})
