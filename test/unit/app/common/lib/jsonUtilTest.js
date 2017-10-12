/* global describe, it */
const jsonUtil = require('../../../../../app/common/lib/jsonUtil')
const assert = require('assert')

require('../../../braveUnit')

describe('jsonUtil test', function () {
  describe('unescapeJSONPointer', function () {
    it('Unescapes ~1 and ~0', function () {
      const input = 'http:~1~1people.ischool.berkeley.edu~1~0nick~1signal-protocol-js~1|0|3'
      const expected = 'http://people.ischool.berkeley.edu/~nick/signal-protocol-js/|0|3'
      const result = jsonUtil.unescapeJSONPointer(input)
      assert.equal(result, expected)
    })

    it('Can do nothing', function () {
      const input = 'tomato'
      const expected = 'tomato'
      const result = jsonUtil.unescapeJSONPointer(input)
      assert.equal(result, expected)
    })
  })
})
