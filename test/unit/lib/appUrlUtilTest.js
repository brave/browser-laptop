/* global describe, it, afterEach */
const mockery = require('mockery')
const assert = require('assert')
const settings = require('../../../js/constants/settings')
const {newTabMode} = require('../../../app/common/constants/settingsEnums')
let appUrlUtil = require('../../../js/lib/appUrlUtil')

require('../braveUnit')

describe('appUrlUtil test', function () {
  const loadMocks = (settings) => {
    mockery.enable({ warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true })
    mockery.registerMock('../settings', settings)
  }

  afterEach(function () {
    mockery.disable()
  })

  describe('newFrameUrl', function () {
    describe('when NEWTAB_MODE = HOMEPAGE', function () {
      it('returns the configured home page', function () {
        loadMocks({ getSetting: (settingKey, settingsCollection) => {
          if (settingKey === settings.NEWTAB_MODE) {
            return newTabMode.HOMEPAGE
          } else if (settingKey === settings.HOMEPAGE) {
            return 'https://brave.com/'
          }
        }})

        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'https://brave.com/')
      })
      it('returns about:blank when home page is falsey', function () {
        loadMocks({ getSetting: (settingKey, settingsCollection) => {
          if (settingKey === settings.NEWTAB_MODE) {
            return newTabMode.HOMEPAGE
          }
        }})

        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'about:blank')
      })
    })

    describe('when NEWTAB_MODE = DEFAULT_SEARCH_ENGINE', function () {
      it('returns the default search engine URL', function () {
        loadMocks({ getSetting: (settingKey, settingsCollection) => {
          if (settingKey === settings.NEWTAB_MODE) {
            return newTabMode.DEFAULT_SEARCH_ENGINE
          } else if (settingKey === settings.DEFAULT_SEARCH_ENGINE) {
            return 'DuckDuckGo'
          }
        }})

        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'https://duckduckgo.com')
      })
    })

    describe('when NEWTAB_MODE = EMPTY_NEW_TAB', function () {
      it('returns about:newtab', function () {
        loadMocks({ getSetting: (settingKey, settingsCollection) => {
          if (settingKey === settings.NEWTAB_MODE) {
            return newTabMode.EMPTY_NEW_TAB
          }
        }})

        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'about:newtab')
      })
    })

    describe('when NEWTAB_MODE = NEW_TAB_PAGE', function () {
      it('returns about:newtab', function () {
        loadMocks({ getSetting: (settingKey, settingsCollection) => {
          if (settingKey === settings.NEWTAB_MODE) {
            return newTabMode.NEW_TAB_PAGE
          }
        }})

        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'about:newtab')
      })
    })

    describe('when NEWTAB_MODE is null or has other values', function () {
      it('returns about:newtab', function () {
        const url = appUrlUtil.newFrameUrl()
        assert.equal(url, 'about:newtab')
      })
    })
  })
})
