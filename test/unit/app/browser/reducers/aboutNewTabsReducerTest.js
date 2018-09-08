/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */

const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
const settings = require('../../../../../js/constants/settings')
require('../../../braveUnit')

describe('aboutNewTabReducerTest', function () {
  let aboutNewTabReducer
  let setSitesStub
  before(function () {
    const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
    setSitesStub = sinon.stub(aboutNewTabState, 'setSites')
    aboutNewTabReducer = require('../../../../../app/browser/reducers/aboutNewTabReducer')
  })

  after(function () {
    setSitesStub.restore()
  })

  afterEach(function () {
    setSitesStub.reset()
  })

  describe('APP_TOP_SITE_DATA_AVAILABLE', function () {
    it('sets the data in new tab state', () => {
      const site1 = Immutable.fromJS({
        location: 'https://example1.com', title: 'sample 1', parentFolderId: 0, count: 23, lastAccessedTime: 123
      })
      const site2 = Immutable.fromJS({
        location: 'https://example2.com', title: 'sample 2', parentFolderId: 0, count: 0
      })
      const topSites = Immutable.fromJS([site1, site2])
      this.newState = aboutNewTabReducer(Immutable.Map(), {actionType: appConstants.APP_TOP_SITE_DATA_AVAILABLE, topSites})
      assert.equal(setSitesStub.calledOnce, true)
      assert.deepEqual(setSitesStub.getCall(0).args[0].toJS(), {})
      assert.deepEqual(setSitesStub.getCall(0).args[1].toJS(), topSites.toJS())
    })
  })

  describe('useAlternativePrivateSearchEngine', function () {
    let initialState = Immutable.fromJS({
      settings: { },
      about: {
        newtab: { pinnedTopSites: [] }
      }
    })
    it('gets a value from default settings when nothing is set', () => {
      const action = {
        actionType: appConstants.APP_SET_STATE
      }
      const newState = aboutNewTabReducer(initialState, action)
      const data = aboutNewTabState.getData(newState)
      const actual = data.get('useAlternativePrivateSearchEngine')
      const actualIsExplicitlySetFromDefault = actual === true || actual === false
      assert.equal(actualIsExplicitlySetFromDefault, true, 'useAlternativePrivateSearchEngine is loaded to new tab data from default setting value')
      this.defaultValue = actual
    })
    it('gets updated when the relevant setting is changed', () => {
      // change it twice so we know it did not just get it from default settings
      const action = {
        actionType: appConstants.APP_CHANGE_SETTING,
        key: settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE,
        value: true
      }
      const newStateForTrue = aboutNewTabReducer(initialState, action)
      const dataForTrue = aboutNewTabState.getData(newStateForTrue)
      const actualForTrue = dataForTrue.get('useAlternativePrivateSearchEngine')
      assert.equal(actualForTrue, true, 'data is updated when setting is changed to true')

      action.value = false
      const newStateForFalse = aboutNewTabReducer(initialState, action)
      const dataForFalse = aboutNewTabState.getData(newStateForFalse)
      const actualForFalse = dataForFalse.get('useAlternativePrivateSearchEngine')
      assert.equal(actualForFalse, false, 'data is updated when setting is changed to false')
    })
  })
})
