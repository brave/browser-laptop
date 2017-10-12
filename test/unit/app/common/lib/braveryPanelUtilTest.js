/* global describe, it */
const braveryPanelUtil = require('../../../../../app/common/lib/braveryPanelUtil')
const assert = require('assert')
const Immutable = require('immutable')

require('../../../braveUnit')

describe('braveryPanelUtil test', function () {
  describe('getRedirectedResources', function () {
    const data = Immutable.fromJS({
      'BootstrapCDN.xml': [
        'http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css',
        'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css'
      ],
      'GoogleAPIs.xml': [
        'http://fonts.googleapis.com/css?family=Source+Sans+Pro'
      ]
    })

    it('returns empty Immutable list if you dont provide resources', function () {
      const result = braveryPanelUtil.getRedirectedResources()
      assert.equal(result, Immutable.List())
    })

    it('merge all resources into one list', function () {
      const result = braveryPanelUtil.getRedirectedResources(data)
      assert.equal(result.size, 3)
    })
  })
})
