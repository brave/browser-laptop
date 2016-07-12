/* global describe, it */

const Brave = require('../lib/brave')
const settings = require('../../js/constants/settings')
const appConfig = require('../../js/constants/appConfig')
const assert = require('assert')

describe('settings', function () {
  Brave.beforeAll(this)
  it('All settings have default values', function * () {
    Object.keys(settings).forEach((setting) => {
      assert.notStrictEqual(appConfig.defaultSettings[settings[setting]], undefined,
        'Default setting for ' + setting + ' should not be undefined')
    })
  })
})
