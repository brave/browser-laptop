/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, beforeEach, after, afterEach, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const windowConstants = require('../../../../js/constants/windowConstants')
const appConstants = require('../../../../js/constants/appConstants')
let doAction
let windowStore
let appActions
require('../../braveUnit')

describe('Window store unit tests', function () {
  const fakeDispatcher = {
    register: (actionHandler) => {
      doAction = actionHandler
    },
    registerLocalCallback: (actionHandler) => {
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
    appActions = require('../../../../js/actions/appActions.js')
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../dispatcher/appDispatcher', fakeDispatcher)
    mockery.registerMock('../actions/appActions', appActions)
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
              tabId: 1,
              key: 1,
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
            }],
            framesInternal: {
              index: {
                1: 0
              },
              tabIndex: {
                1: 0
              }
            }
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
          frameProps: Immutable.fromJS({
            tabId: 1,
            key: 1
          })
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
      })
    })

    describe('APP_NEW_WEB_CONTENTS_ADDED', function () {
      let windowState
      let tabDetachMenuItemClickedStub
      const demoWindowState = {
        frames: [{
          security: {
            isSecure: null
          },
          src: 'https://brave.com',
          lastAccessedTime: null,
          guestInstanceId: 2,
          partition: 'persist:default',
          findDetail: {
            searchString: '',
            caseSensitivity: false
          },
          endLoadTime: null,
          navbar: {
            urlbar: {
              location: 'https://brave.com',
              suggestions: {
                selectedIndex: 0,
                searchResults: [],
                suggestionList: null
              },
              selected: false,
              focused: true,
              active: false
            }
          },
          tabId: 8,
          zoomLevel: 0,
          breakpoint: 'default',
          index: 1,
          partitionNumber: 0,
          history: [],
          audioMuted: false,
          startLoadTime: null,
          location: 'https://brave.com',
          disposition: 'background-tab',
          title: 'page title goes here',
          searchDetail: null,
          icon: 'https://brave.com/favicon.ico',
          isPrivate: false,
          openerTabId: 1,
          parentFrameKey: null,
          loading: false,
          unloaded: true,
          key: 2
        }],
        framesInternal: {
          index: {
            8: 0
          },
          tabIndex: {
            8: 0
          }
        }
      }
      const demoAction = {
        actionType: appConstants.APP_NEW_WEB_CONTENTS_ADDED,
        queryInfo: {
          windowId: 1
        },
        frameOpts: {
          location: 'about:blank',
          partition: 'persist:default',
          active: true,
          guestInstanceId: 2,
          tabId: 8,
          isPinned: false,
          openerTabId: 8,
          disposition: 'foreground-tab',
          unloaded: false
        },
        tabValue: {
          audible: false,
          width: 300,
          active: true,
          height: 300,
          guestInstanceId: 2,
          autoDiscardable: true,
          partition: 'persist:default',
          windowId: -1,
          incognito: false,
          canGoForward: false,
          url: '',
          tabId: 8,
          index: -1,
          status: 'complete',
          highlighted: false,
          partitionNumber: 0,
          title: '',
          pinned: false,
          mutedInfo: {
            muted: false,
            reason: 'user'
          },
          id: 8,
          selected: true,
          discarded: false,
          canGoBack: false
        }
      }

      beforeEach(function () {
        tabDetachMenuItemClickedStub = sinon.stub(appActions, 'tabDetachMenuItemClicked')
      })

      afterEach(function () {
        reducers.forEach((reducer) => {
          mockery.deregisterMock(reducer)
        })

        tabDetachMenuItemClickedStub.restore()
      })

      describe('when tab being opened is active', function () {
        before(function () {
          const fakeReducer = (state, action) => {
            return Immutable.fromJS(demoWindowState)
          }
          reducers.forEach((reducer) => {
            mockery.registerMock(reducer, fakeReducer)
          })
          doAction(demoAction)

          // get the updated windowState (AFTER doAction runs)
          windowStore = require('../../../../js/stores/windowStore.js')
          windowState = windowStore.getState()
        })

        it('sets activeFrameKey', function () {
          assert(windowState.get('activeFrameKey'))
        })
      })

      describe('when tab being opened is not active', function () {
        before(function () {
          const newAction = Object.assign(demoAction, {})
          newAction.frameOpts.active = false
          newAction.tabValue.active = false

          const fakeReducer = (state, action) => {
            return Immutable.fromJS(demoWindowState)
          }
          reducers.forEach((reducer) => {
            mockery.registerMock(reducer, fakeReducer)
          })
          doAction(newAction)

          // get the updated windowState (AFTER doAction runs)
          windowStore = require('../../../../js/stores/windowStore.js')
          windowState = windowStore.getState()
        })

        it('does not set activeFrameKey', function () {
          assert.equal(windowState.get('activeFrameKey'), undefined)
        })
      })
    })

    // TODO: add your tests if you modify windowStore.js :)
  })
})
