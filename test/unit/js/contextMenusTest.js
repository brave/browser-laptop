/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
let fakeElectronMenu
let contextMenus
require('../braveUnit')

describe('Context menu module unit tests', function () {
  const fakeLocale = {
    translation: (token) => { return token }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../lib/fakeElectron'))
    mockery.registerMock('../js/l10n', fakeLocale)
    contextMenus = require('../../../js/contextMenus')
    fakeElectronMenu = require('../lib/fakeElectronMenu')
  })

  after(function () {
    mockery.disable()
  })

  describe('onMainContextMenu', function () {
    describe('when calling mainTemplateInit', function () {
      let menuPopupSpy
      let menuDestroySpy

      before(function () {
        menuPopupSpy = sinon.spy(fakeElectronMenu, 'popup')
        menuDestroySpy = sinon.spy(fakeElectronMenu, 'destroy')
      })

      after(function () {
        menuPopupSpy.restore()
      })

      it('calls menu.popup', function () {
        menuPopupSpy.reset()
        contextMenus.onMainContextMenu()
        assert.equal(menuPopupSpy.calledOnce, true)
      })

      it('calls menu.destroy', function () {
        menuDestroySpy.reset()
        contextMenus.onMainContextMenu()
        assert.equal(menuDestroySpy.calledOnce, true)
      })
    })
  })
})
