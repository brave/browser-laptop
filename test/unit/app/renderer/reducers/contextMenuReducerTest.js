/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const fakeElectron = require('../../../lib/fakeElectron')
const windowConstants = require('../../../../../js/constants/windowConstants')

describe('contextMenuReducer', function () {
  let fakeElectronMenu, contextMenuReducer

  const fakeLocale = {
    translation: (token) => { return token }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/l10n.js', fakeLocale)
    fakeElectronMenu = require('../../../lib/fakeElectronMenu')
    contextMenuReducer = require('../../../../../app/renderer/reducers/contextMenuReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('WINDOW_ON_TAB_PAGE_CONTEXT_MENU', function () {
    let menuBuildFromTemplateSpy, menuPopupSpy, state

    before(function () {
      state = Immutable.fromJS({
        frames: [{
          tabId: 1,
          key: 1
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
    })

    beforeEach(function () {
      menuBuildFromTemplateSpy = sinon.spy(fakeElectron.remote.Menu, 'buildFromTemplate')
      menuPopupSpy = sinon.spy(fakeElectronMenu, 'popup')
    })

    afterEach(function () {
      menuBuildFromTemplateSpy.restore()
      menuPopupSpy.restore()
    })

    it('index is outside the scope', function () {
      const action = {
        actionType: windowConstants.WINDOW_ON_TAB_PAGE_CONTEXT_MENU,
        index: -1
      }
      contextMenuReducer(state, action)
      assert.equal(menuBuildFromTemplateSpy.calledOnce, false)
      assert.equal(menuPopupSpy.calledOnce, false)
    })

    it('index is correct', function () {
      const action = {
        actionType: windowConstants.WINDOW_ON_TAB_PAGE_CONTEXT_MENU,
        index: 0
      }
      contextMenuReducer(state, action)
      assert.equal(menuBuildFromTemplateSpy.calledOnce, true)
      assert.equal(menuPopupSpy.calledOnce, true)
    })
  })
})
