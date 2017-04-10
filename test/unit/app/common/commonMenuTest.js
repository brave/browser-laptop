/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../lib/fakeElectron')
let commonMenu, appActions
let localeSpy
require('../../braveUnit')

describe('Common menu module unit tests', function () {
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
    mockery.registerMock('../../js/l10n', fakeLocale)
    commonMenu = require('../../../../app/common/commonMenu')
    appActions = require('../../../../js/actions/appActions')
    localeSpy = sinon.spy(fakeLocale, 'translation')
  })

  after(function () {
    mockery.disable()
    localeSpy.restore()
  })

  const checkExpectedDefaults = (createMenuItem, checkAccelerator = true) => {
    localeSpy.reset()
    const menuItem = createMenuItem()
    if (checkAccelerator) {
      assert.ok(menuItem.accelerator)
    }
    assert.equal(localeSpy.calledOnce, true)
  }

  describe('sendToFocusedWindow', function () {
  })

  describe('quitMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.quitMenuItem)
    })
    describe('when clicked', function () {
      let shuttingDownStub
      before(function () {
        shuttingDownStub = sinon.stub(appActions, 'shuttingDown')
      })
      after(function () {
        shuttingDownStub.restore()
      })
      it('calls appAction.shuttingDown', function () {
        shuttingDownStub.reset()
        commonMenu.quitMenuItem().click()
        assert.equal(shuttingDownStub.calledOnce, true)
      })
    })
  })

  describe('newTabMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.newTabMenuItem)
    })
  })

  describe('newPrivateTabMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.newPrivateTabMenuItem)
    })
  })

  describe('newPartitionedTabMenuItem', function () {
  })

  describe('newWindowMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.newWindowMenuItem)
    })
  })

  describe('reopenLastClosedTabItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.reopenLastClosedTabItem)
    })
  })

  describe('separatorMenuItem', function () {
  })

  describe('printMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.printMenuItem)
    })
  })

  describe('findOnPageMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.findOnPageMenuItem)
    })
  })

  describe('checkForUpdateMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.checkForUpdateMenuItem, false)
    })
  })

  describe('preferencesMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.preferencesMenuItem)
    })
  })

  describe('bookmarksManagerMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.bookmarksManagerMenuItem)
    })
  })

  describe('historyMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.historyMenuItem)
    })
  })

  describe('downloadsMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.downloadsMenuItem)
    })
  })

  describe('passwordsMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.passwordsMenuItem, false)
    })
  })

  describe('extensionsMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.extensionsMenuItem, false)
    })
  })

  describe('importBrowserDataMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.importBrowserDataMenuItem, false)
    })
  })

  describe('exportBookmarksMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.exportBookmarksMenuItem, false)
    })
  })

  describe('submitFeedbackMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.submitFeedbackMenuItem, false)
    })
  })

  describe('bookmarksToolbarMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.bookmarksToolbarMenuItem, false)
    })
  })

  describe('autoHideMenuBarMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.autoHideMenuBarMenuItem, false)
    })
  })

  describe('aboutBraveMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.aboutBraveMenuItem, false)
    })
  })

  describe('braverySiteMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.braverySiteMenuItem, false)
    })
  })

  describe('braveryGlobalMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.braveryGlobalMenuItem, false)
    })
  })

  describe('braveryPaymentsMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.braveryPaymentsMenuItem, false)
    })
  })

  describe('reloadPageMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.reloadPageMenuItem)
    })
  })

  describe('cleanReloadMenuItem', function () {
    it('has the expected defaults set', function () {
      checkExpectedDefaults(commonMenu.cleanReloadMenuItem)
    })
  })
})
