/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('importerReducer unit test', function () {
  let importerReducer

  const state = Immutable.fromJS({
    windows: [],
    tabs: []
  })

  const importer = {
    importHTML: () => {},
    importData: () => {}
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../importer', importer)
    importerReducer = require('../../../../../app/browser/reducers/importerReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_IMPORT_BROWSER_DATA', function () {
    let spyHTML, spyData

    afterEach(function () {
      spyHTML.restore()
      spyData.restore()
    })

    it('null case', function () {
      spyHTML = sinon.spy(importer, 'importHTML')
      spyData = sinon.spy(importer, 'importData')
      importerReducer(state, {
        actionType: appConstants.APP_IMPORT_BROWSER_DATA
      })
      assert.equal(spyHTML.notCalled, true)
      assert.equal(spyData.notCalled, true)
    })

    it('type is not HTML (index 5)', function () {
      spyHTML = sinon.spy(importer, 'importHTML')
      spyData = sinon.spy(importer, 'importData')
      importerReducer(state, {
        actionType: appConstants.APP_IMPORT_BROWSER_DATA,
        selected: {
          type: 4
        }
      })
      assert.equal(spyHTML.notCalled, true)
      assert.equal(spyData.calledOnce, true)
    })

    it('type is HTML (index 5), but favourites are not defined', function () {
      spyHTML = sinon.spy(importer, 'importHTML')
      spyData = sinon.spy(importer, 'importData')
      importerReducer(state, {
        actionType: appConstants.APP_IMPORT_BROWSER_DATA,
        selected: {
          type: 5
        }
      })
      assert.equal(spyHTML.notCalled, true)
      assert.equal(spyData.notCalled, true)
    })

    it('type is HTML (index 5) and favourites are selected', function () {
      spyHTML = sinon.spy(importer, 'importHTML')
      spyData = sinon.spy(importer, 'importData')
      importerReducer(state, {
        actionType: appConstants.APP_IMPORT_BROWSER_DATA,
        selected: {
          type: 5,
          favorites: true
        }
      })
      assert.equal(spyHTML.calledOnce, true)
      assert.equal(spyData.notCalled, true)
    })
  })
})
