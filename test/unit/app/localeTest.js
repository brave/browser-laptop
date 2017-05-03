/* global describe, it, before, after, beforeEach */
const Immutable = require('immutable')
const assert = require('assert')

require('../braveUnit')

describe.skip('locale unit test', function () {
  let locale
  before(function () {
    process.type = 'browser'
    locale = require('../../../app/locale')
    settingObserver.init()
  })

  beforeEach(function () {
    appActions.setState(Immutable.fromJS({}))
  })

  it('Auto-detect user language', function * () {
    assert(locale.init())
  })

  it('Force default language', function * () {
     assert(locale.init(defaultLocale))
  })

  it('Force not exist language', function * () {
      assert(locale.init('zz-ZZ'))
  })
})
