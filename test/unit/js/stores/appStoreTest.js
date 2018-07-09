/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, afterEach, it */

const mockery = require('mockery')
// const assert = require('assert')
// const sinon = require('sinon')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
// const windowConstants = require('../../../../js/constants/windowConstants')
const appConstants = require('../../../../js/constants/appConstants')
let doAction
// let appStore
let appActions
require('../../braveUnit')

describe('App store unit tests', function () {
  const fakeDispatcher = {
    register: (actionHandler) => {
      doAction = actionHandler
    },
    registerLocalCallback: (actionHandler) => {
      doAction = actionHandler
    }
  }

  const reducers = [
    '../../app/browser/reducers/downloadsReducer',
    '../../app/browser/reducers/flashReducer',
    '../../app/browser/reducers/dappReducer',
    '../../app/browser/reducers/autoplayReducer',
    '../../app/browser/reducers/tabsReducer',
    '../../app/browser/reducers/urlBarSuggestionsReducer',
    '../../app/browser/reducers/bookmarksReducer',
    '../../app/browser/reducers/bookmarkFoldersReducer',
    '../../app/browser/reducers/historyReducer',
    '../../app/browser/reducers/pinnedSitesReducer',
    '../../app/browser/reducers/windowsReducer',
    '../../app/browser/reducers/syncReducer',
    '../../app/browser/reducers/clipboardReducer',
    '../../app/browser/reducers/passwordManagerReducer',
    '../../app/browser/reducers/spellCheckerReducer',
    '../../app/browser/reducers/tabMessageBoxReducer',
    '../../app/browser/reducers/dragDropReducer',
    '../../app/browser/reducers/extensionsReducer',
    '../../app/browser/reducers/shareReducer',
    '../../app/browser/reducers/updatesReducer',
    '../../app/browser/reducers/aboutNewTabReducer',
    '../../app/browser/reducers/braverySettingsReducer',
    '../../app/browser/reducers/bookmarkToolbarReducer',
    '../../app/browser/reducers/siteSettingsReducer',
    '../../app/browser/reducers/pageDataReducer',
    '../../app/browser/reducers/ledgerReducer',
    '../../app/browser/reducers/menuReducer'
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
    mockery.registerMock('ad-block', require('../../lib/fakeAdBlock'))
    mockery.registerMock('leveldown', {})
    mockery.registerMock('../../app/browser/api/topSites', {
      calculateTopSites: () => {}
    })

    const modulesNeedingInit = [
      '../../app/filtering',
      '../../app/browser/basicAuth',
      '../../app/browser/webtorrent',
      '../../app/browser/profiles',
      '../../app/sync'
    ]
    modulesNeedingInit.forEach((moduleNeedingInit) => {
      mockery.registerMock(moduleNeedingInit, {
        init: (appState, action, appStore) => {}
      })
    })

    require('../../../../js/stores/appStore.js')
  })

  after(function () {
    mockery.disable()
  })

  const callWithMissingValues = (labelForUnitTest, fieldName, demoAction) => {
    describe(labelForUnitTest, function () {
      afterEach(function () {
        reducers.forEach((reducer) => {
          mockery.deregisterMock(reducer)
        })
      })

      const performCall = (field) => {
        const fakeReducer = (state, action, immutableAction) => {
          return Immutable.fromJS(field)
        }
        reducers.forEach((reducer) => {
          mockery.registerMock(reducer, fakeReducer)
        })
        require('../../../../js/stores/appStore.js')
        doAction({actionType: appConstants.APP_SET_STATE})
        doAction(demoAction)
      }

      it(`does not throw exception when \`${fieldName}\` is missing from appState`, function () {
        performCall({})
      })

      it(`does not throw exception when \`${fieldName}\` is undefined`, function () {
        const field = {}
        field[fieldName] = undefined
        performCall(field)
      })

      it(`does not throw exception when \`${fieldName}\` is null`, function () {
        const field = {}
        field[fieldName] = null
        performCall(field)
      })
    })
  }

  describe('doAction', function () {
    callWithMissingValues(
      'APP_SHOW_NOTIFICATION',
      'notifications',
      {
        actionType: appConstants.APP_SHOW_NOTIFICATION
      }
    )

    callWithMissingValues(
      'APP_HIDE_NOTIFICATION',
      'notifications',
      {
        actionType: appConstants.APP_HIDE_NOTIFICATION
      }
    )

    // TODO: add your tests if you modify appStore.js :)
  })
})
