/* global describe, it */
const pinnedSitesUtil = require('../../../../../app/common/lib/pinnedSitesUtil')
const assert = require('assert')
const Immutable = require('immutable')

require('../../../braveUnit')

describe('pinnedSitesUtil', () => {
  const location = 'https://css-tricks.com/'
  const order = 9
  const partitionNumber = 5
  const expectedSiteProps = Immutable.fromJS({
    location,
    order,
    partitionNumber
  })

  let site = Immutable.fromJS({
    favicon: 'https://css-tricks.com/favicon.ico',
    lastAccessedTime: 1493560182224,
    location: location,
    order: order,
    partitionNumber: partitionNumber,
    title: 'CSS-Tricks'
  })

  describe('getPinnedSiteProps', () => {
    it('returns object with necessary fields', () => {
      const result = pinnedSitesUtil.getPinnedSiteProps(site)
      assert.deepEqual(expectedSiteProps, result)
    })

    it('set partitionNumber field to 0 in case of missing this field', () => {
      const newSite = site.delete('partitionNumber')
      const result = pinnedSitesUtil.getPinnedSiteProps(newSite)
      assert.equal(0, result.get('partitionNumber'))
    })
  })
})
