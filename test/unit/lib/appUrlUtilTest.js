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

  describe('getBraveExtUrl', function () {
    it('arg', function () {
      assert.equal(appUrlUtil.getBraveExtUrl('test'),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/test')
    })
    it('no arg', function () {
      assert.equal(appUrlUtil.getBraveExtUrl(),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/')
    })
  })
  describe('getTorrentExtUrl', function () {
    it('arg', function () {
      assert.equal(appUrlUtil.getTorrentExtUrl('test'),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/test')
    })
    it('no arg', function () {
      assert.equal(appUrlUtil.getTorrentExtUrl(),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/')
    })
  })
  describe('aboutUrls', function () {
    it('about:about', function () {
      assert.equal(appUrlUtil.aboutUrls.get('about:about'),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-about.html')
    })
  })
  describe('magnet url translation', function () {
    it('getTargetMagnetUrl', function () {
      assert.equal(appUrlUtil.getTargetMagnetUrl('magnet:?foo=bar'),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar')
    })
    it('getSourceMagnetUrl', function () {
      assert.equal(appUrlUtil.getSourceMagnetUrl(
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar'),
        'magnet:?foo=bar')
    })
    it('isTargetMagnetUrl', function () {
      assert.equal(appUrlUtil.isSourceMagnetUrl('magnet:?foo=bar'), true)
    })
    it('isSourceMagnetUrl', function () {
      assert.equal(appUrlUtil.isTargetMagnetUrl(
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar'),
        true)
    })
  })

  describe('fileUrl', function () {
    if (process.platform === 'win32') {
      it('can convert Windows paths to file URLS', function () {
        const filePath = 'C:\\Users\\bbondy\\tesT.html'
        const fileUrl = appUrlUtil.fileUrl(filePath)
        const expected = 'file:///C:/Users/bbondy/tesT.html'
        assert.equal(fileUrl, expected)
      })
    }
    it('can convert unix paths', function () {
      const filePath = '/users/bbondy/tesT.html'
      const fileUrl = appUrlUtil.fileUrl(filePath)
      const expected = 'file:///users/bbondy/tesT.html'
      assert.equal(fileUrl, expected)
    })
  })
  describe('chromeUrl', function () {
    it('can convert file paths', function () {
      const filePath = 'file:///users/bbondy/space%20here/tesT.html'
      const chromeUrl = appUrlUtil.chromeUrl(filePath)
      const expected = 'chrome://brave/users/bbondy/space%20here/tesT.html'
      assert.equal(chromeUrl, expected)
    })
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
