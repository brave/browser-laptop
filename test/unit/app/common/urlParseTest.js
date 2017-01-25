/* global describe, it */
const assert = require('assert')
const url = require('url')
const urlParse = require('../../../../app/common/urlParse')
const config = require('../../../../js/constants/config')

require('../../braveUnit')

const url1 = 'https://www.brave.com/2/3/5/7/11?13=17&19=23#29'
const url2 = 'https://www.brianbondy.com'

describe('urlParse', function () {
  it('parsing a URL once gives the same result as node', function () {
    const result1 = url.parse(url1)
    const result2 = urlParse(url1)
    assert.deepEqual(result1, result2)
  })
  it('parsing a URL once gives the same result as node', function () {
    const url1Result1 = url.parse(url1)
    const url1Result2 = urlParse(url1)
    const url2Result1 = url.parse(url2)
    const url2Result2 = urlParse(url2)
    assert.deepEqual(url1Result1, url1Result2)
    assert.deepEqual(url2Result1, url2Result2)
  })
  it('returns the same result on repeated parsing', function () {
    const result1 = url.parse(url1)
    for (let i = 0; i < config.cache.urlParse + 1; i++) {
      let result2 = urlParse(url1)
      assert.deepEqual(result1, result2)
    }
  })
  it('returns the correct result when exceeding cache', function () {
    for (let i = 0; i < config.cache.urlParse + 1; i++) {
      let result1 = url.parse(url1 + i)
      let result2 = urlParse(url1 + i)
      assert.deepEqual(result1, result2)
    }
    const result1 = url.parse(url1)
    const result2 = urlParse(url1)
    assert.deepEqual(result1, result2)
  })
})

