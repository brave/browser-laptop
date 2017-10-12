/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */

const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('topSitesReducerTest', function () {
  let topSitesReducer
  let setSitesStub
  before(function () {
    const aboutNewTabState = require('../../../../../app/common/state/aboutNewTabState')
    setSitesStub = sinon.stub(aboutNewTabState, 'setSites')
    topSitesReducer = require('../../../../../app/browser/reducers/topSitesReducer')
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
      this.newState = topSitesReducer(Immutable.Map(), {actionType: appConstants.APP_TOP_SITE_DATA_AVAILABLE, topSites})
      assert.equal(setSitesStub.calledOnce, true)
      assert.deepEqual(setSitesStub.getCall(0).args[0].toJS(), {})
      assert.deepEqual(setSitesStub.getCall(0).args[1].toJS(), topSites.toJS())
    })
  })
})
