/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
// const sinon = require('sinon')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const windowConstants = require('../../../../js/constants/windowConstants')
let doAction
let windowStore
require('../../braveUnit')

describe('Window store unit tests', function () {
  const fakeDispatcher = {
    register: (actionHandler) => {
      doAction = actionHandler
    }
  }

  const reducers = [
    '../../app/renderer/reducers/urlBarReducer',
    '../../app/renderer/reducers/urlBarSuggestionsReducer',
    '../../app/renderer/reducers/frameReducer',
    '../../app/renderer/reducers/contextMenuReducer'
  ]

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../dispatcher/appDispatcher', fakeDispatcher)
    windowStore = require('../../../../js/stores/windowStore.js')
  })

  after(function () {
    mockery.disable()
  })

  describe('doAction', function () {
    describe('WINDOW_WEBVIEW_LOAD_START', function () {
      let windowState

      before(function () {
        const fakeReducer = (state, action) => {
          // return the window state we want for our test :)
          return Immutable.fromJS({
            frames: [{
              tabId: 0,
              key: 0,
              loading: false,
              startLoadTime: new Date().getTime(),
              endLoadTime: 1337,
              security: {
                isSecure: 'sure!!!',
                runInsecureContent: 'nespresso_is_safe_trust_me',
                blockedRunInsecureContent: {
                  nespresso: 'whatElse'
                }
              }
            }]
          })
        }

        // since reducers always run first, just return whatever
        // window state we want our test to have
        reducers.forEach((reducer) => {
          mockery.registerMock(reducer, fakeReducer)
        })

        // call doAction for WINDOW_WEBVIEW_LOAD_START
        doAction({
          actionType: windowConstants.WINDOW_WEBVIEW_LOAD_START,
          frameProps: {
            tabId: 0,
            key: 0
          }
        })

        // get the updated windowState (AFTER doAction runs)
        windowStore = require('../../../../js/stores/windowStore.js')
        windowState = windowStore.getState()
      })

      after(function () {
        reducers.forEach((reducer) => {
          mockery.deregisterMock(reducer)
        })
      })

      describe('security state', function () {
        it('resets security state', function () {
          assert.deepEqual(
            windowState.getIn(['frames', 0, 'security']),
            Immutable.fromJS({
              isSecure: null,
              runInsecureContent: false
            }))
        })
      })

      describe('update loading UI', function () {
        describe('for frames', function () {
          it('sets loading=true', function () {
            assert.equal(windowState.getIn(['frames', 0, 'loading']), true)
          })
          it('sets startLoadTime to current time', function () {
            assert.deepEqual(
              windowState.getIn(['frames', 0, 'startLoadTime']),
              windowState.getIn(['frames', 0, 'startLoadTime'])
            )
          })
          it('sets endLoadTime=null', function () {
            assert.equal(windowState.getIn(['frames', 0, 'endLoadTime']), null)
          })
        })

        describe('for tabs', function () {
          it('sets loading=true for tab', function () {
            assert.equal(windowState.getIn(['tabs', 0, 'loading']), true)
          })
        })
      })
    })

    // TODO: add your tests if you modify windowStore.js :)
  })
})
