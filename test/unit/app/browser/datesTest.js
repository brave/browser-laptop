/* global describe, it */

const assert = require('assert')

var dates = require('../../../../app/dates')

require('../../braveUnit')

describe('update date handling', function () {
  it('lastMonday', function () {
    var d = new Date(1510708981887)
    assert.equal(dates.lastMonday(d), '2017-11-13', 'previous Monday')
  })
})
