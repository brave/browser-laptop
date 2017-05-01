/* global describe, beforeEach, it */
const windowsUtil = require('../../../../../app/common/lib/windowsUtil')
const assert = require('assert')
const Immutable = require('immutable')

require('../../../braveUnit')

describe('windowsUtil', () => {
  const location = 'https://css-tricks.com/'
  const order = 9
  const partitionNumber = 5
  const expectedSiteProps = Immutable.fromJS({
    location,
    order,
    partitionNumber
  })
  let site

  describe('getPinnedSiteProps', () => {
    beforeEach(() => {
      site = Immutable.fromJS({
        favicon: 'https://css-tricks.com/favicon.ico',
        lastAccessedTime: 1493560182224,
        location: location,
        order: order,
        partitionNumber: partitionNumber,
        title: 'CSS-Tricks'
      })
    })
    it('returns object with necessary fields', () => {
      const result = windowsUtil.getPinnedSiteProps(site)
      assert.deepEqual(expectedSiteProps, result)
    })
    it('set partitionNumber field to 0 in case of missing this field', () => {
      site = site.delete('partitionNumber')
      const result = windowsUtil.getPinnedSiteProps(site)
      assert.equal(0, result.get('partitionNumber'))
    })
  })
})
