/* global describe, it */
const obsoletionStateHelper = require('../../../../../app/common/state/obsoletionStateHelper')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({})

describe('obsoletionStateHelper unit tests', function () {
  describe('getIsObsolete', function () {
    it('is not obsolete within the time range', function () {
      const appState = defaultAppState.set('deprecatedOn', new Date().getTime())
      const actualIsObsolete = obsoletionStateHelper.getIsObsolete(appState)
      assert.equal(actualIsObsolete, false)
    })

    it('is obsolete outside the time range', function () {
      const elevenDays = 1000 * 60 * 60 * 24 * 10
      const appState = defaultAppState.set('deprecatedOn', new Date().getTime() - elevenDays)
      const actualIsObsolete = obsoletionStateHelper.getIsObsolete(appState)
      assert.equal(actualIsObsolete, true)
    })

    it('updates at the appropriate interval', async function () {
      const tenDays = 1000 * 60 * 60 * 24 * 10
      const appState = defaultAppState.set('deprecatedOn', new Date().getTime() - tenDays + 1)
      const actualIsObsolete = obsoletionStateHelper.getIsObsolete(appState)
      assert.equal(actualIsObsolete, false)
      // wait 2 ms
      await new Promise(resolve => setTimeout(resolve, 2))
      // re-check
      obsoletionStateHelper.test_fireResetInterval()
      const actualIsObsoleteNext = obsoletionStateHelper.getIsObsolete(appState)
      assert.equal(actualIsObsoleteNext, true)
    })
  })
})
