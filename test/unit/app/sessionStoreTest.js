/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const settings = require('../../../js/constants/settings')
const {makeImmutable} = require('../../../app/common/state/immutableUtil')
const downloadStates = require('../../../js/constants/downloadStates')
const siteUtil = require('../../../js/state/siteUtil')
const compareVersions = require('compare-versions')

require('../braveUnit')

describe('sessionStore unit tests', function () {
  let sessionStore
  let shutdownClearHistory = false
  let shutdownClearAutocompleteData = false
  let shutdownClearAutofillData = false
  let shutdownClearSiteSettings = false
  const fakeElectron = require('../lib/fakeElectron')
  const fakeAutofill = {
    init: () => {},
    addAutofillAddress: () => {},
    removeAutofillAddress: () => {},
    addAutofillCreditCard: () => {},
    removeAutofillCreditCard: () => {},
    clearAutocompleteData: () => {},
    clearAutofillData: () => {}
  }
  global.muon = {
    file: {
      writeImportant: (path, data, cb) => {
        // simulate running on another thread
        setImmediate(() => {
          cb(true)
        })
      }
    }
  }
  const fakeFiltering = {
    clearStorageData: () => {},
    clearCache: () => {},
    clearHistory: () => {}
  }
  const fakeTabState = {
    getPersistentState: (data) => { return makeImmutable(data) }
  }
  const fakeWindowState = {
    getPersistentState: (data) => { return makeImmutable(data) }
  }
  const fakeFileSystem = require('../lib/fakeFileSystem')
  const mockSiteUtil = {
    clearHistory: (sites) => {
      return siteUtil.clearHistory(sites)
    },
    getSiteKey: (siteDetail) => {
      return siteUtil.getSiteKey(siteDetail)
    },
    getLocationFromSiteKey: (siteKey) => {
      return siteUtil.getLocationFromSiteKey(siteKey)
    }
  }
  const fakeLocale = {
    init: (language) => {
      return new Promise((resolve, reject) => {
        resolve()
      })
    },
    translation: (token) => {
      return token
    }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('fs-extra', fakeFileSystem)
    mockery.registerMock('fs', fakeFileSystem)
    mockery.registerMock('compare-versions', compareVersions)
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./locale', fakeLocale)
    mockery.registerMock('../js/state/siteUtil', mockSiteUtil)
    mockery.registerMock('./autofill', fakeAutofill)
    mockery.registerMock('./common/state/tabState', fakeTabState)
    mockery.registerMock('./common/state/windowState', fakeWindowState)
    mockery.registerMock('../js/settings', {
      getSetting: (settingKey, settingsCollection, value) => {
        switch (settingKey) {
          case settings.SHUTDOWN_CLEAR_HISTORY:
            return shutdownClearHistory
          case settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA:
            return shutdownClearAutocompleteData
          case settings.SHUTDOWN_CLEAR_AUTOFILL_DATA:
            return shutdownClearAutofillData
          case settings.SHUTDOWN_CLEAR_SITE_SETTINGS:
            return shutdownClearSiteSettings
          default: return true
        }
      }
    })
    mockery.registerMock('./filtering', fakeFiltering)
    sessionStore = require('../../../app/sessionStore')
  })

  after(function () {
    mockery.disable()
  })

  describe('saveAppState', function () {
    let cleanAppDataStub
    let cleanSessionDataOnShutdownStub

    before(function () {
      cleanAppDataStub = sinon.stub(sessionStore, 'cleanAppData').returns(Immutable.Map())
      cleanSessionDataOnShutdownStub = sinon.stub(sessionStore, 'cleanSessionDataOnShutdown')
    })

    after(function () {
      cleanAppDataStub.restore()
      cleanSessionDataOnShutdownStub.restore()
    })

    it('calls cleanAppData', function (cb) {
      cleanAppDataStub.reset()
      return sessionStore.saveAppState(Immutable.Map())
        .then(function (result) {
          assert.equal(cleanAppDataStub.calledOnce, true)
          cb()
        }, function (err) {
          assert(!err)
        })
    })

    describe('with isShutdown', function () {
      before(function () {
        this.writeImportantSpy = sinon.spy(muon.file, 'writeImportant')
      })
      after(function () {
        this.writeImportantSpy.restore()
      })
      it('calls cleanSessionDataOnShutdown if true', function (cb) {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState(Immutable.Map(), true)
          .then(() => {
            assert.equal(cleanSessionDataOnShutdownStub.calledOnce, true)
            cb()
          }, function (err) {
            assert(!err)
          })
      })

      it('does not call cleanSessionDataOnShutdown if false', function (cb) {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState(Immutable.Map(), false)
          .then(() => {
            assert.equal(cleanSessionDataOnShutdownStub.notCalled, true)
            cb()
          }, function (err) {
            assert(!err)
          })
      })

      it('sets cleanedOnShutdown for saveAppState', function (cb) {
        sessionStore.saveAppState(Immutable.Map(), true)
          .then(() => {
            assert.equal(JSON.parse(this.writeImportantSpy.getCall(0).args[1]).cleanedOnShutdown, true)
            cb()
          }, function (err) {
            assert(!err)
          })
      })

      it('sets lastAppVersion for saveAppState', function (cb) {
        sessionStore.saveAppState(Immutable.Map(), true)
          .then(() => {
            assert.equal(JSON.parse(this.writeImportantSpy.getCall(0).args[1]).lastAppVersion, '0.14.0')
            cb()
          }, function (err) {
            assert(!err)
          })
      })
    })
  })

  describe('cleanPerWindowData', function () {
    const withClosedFrames = Immutable.fromJS({
      activeFrameKey: 1,
      closedFrames: [
        {key: 1, location: 'http://example.com'},
        {key: 2, location: 'https://brave.com'}
      ]
    })
    const cleanedWithClosedFrames = {
      activeFrameKey: 1,
      closedFrames: [
        {key: 1, location: 'http://example.com', unloaded: true, src: 'http://example.com'},
        {key: 2, location: 'https://brave.com', unloaded: true, src: 'https://brave.com'}
      ],
      frames: []
    }

    it('handles being passed falsey input (adding frames)', function () {
      const result = sessionStore.cleanPerWindowData()
      assert.deepEqual(result.toJS(), {frames: []})
    })
    it('throws an error when input is mutable', function () {
      assert.throws(() => {
        sessionStore.cleanPerWindowData({windowStuff: 'demo'})
      },
      /undefined == true/,
      'did not throw with expected message')
    })
    describe('when SHUTDOWN_CLEAR_HISTORY is true', function () {
      before(function () {
        shutdownClearHistory = true
      })
      after(function () {
        shutdownClearHistory = false
      })
      describe('when isShutdown is true', function () {
        it('clears closedFrames', function () {
          const result = sessionStore.cleanPerWindowData(withClosedFrames, true)
          assert.deepEqual(result.toJS(), {
            activeFrameKey: 1,
            closedFrames: [],
            frames: []
          })
        })
      })
      describe('when isShutdown is false', function () {
        it('does not modify closedFrames', function () {
          const result = sessionStore.cleanPerWindowData(withClosedFrames, false)
          assert.deepEqual(result.toJS(), cleanedWithClosedFrames)
        })
      })
    })
    describe('when closedFrames exists', function () {
      it('works when closedFrames is empty', function () {
        const result = sessionStore.cleanPerWindowData(
          Immutable.fromJS({
            closedFrames: []
          })
        )
        assert.deepEqual(result.toJS(), {
          closedFrames: [],
          frames: []
        })
      })
      it('works when closedFrames contains a null entry', function () {
        const result = sessionStore.cleanPerWindowData(
          Immutable.fromJS({
            activeFrameKey: 1,
            closedFrames: [
              {key: 1, location: 'http://example.com'},
              null,
              {key: 2, location: 'https://brave.com'}
            ]
          })
        )
        assert.deepEqual(result.toJS(), cleanedWithClosedFrames)
      })
      it('re-assigns the key for each item in closedFrames', function () {
        const result = sessionStore.cleanPerWindowData(
          Immutable.fromJS({
            activeFrameKey: 1,
            closedFrames: [
              {key: 22, location: 'http://example.com'},
              {key: 23, location: 'https://brave.com'}
            ]
          })
        )
        assert.deepEqual(result.toJS(), {
          activeFrameKey: 1,
          closedFrames: [
            {key: 1, location: 'http://example.com', unloaded: true, src: 'http://example.com'},
            {key: 2, location: 'https://brave.com', unloaded: true, src: 'https://brave.com'}
          ],
          frames: []
        })
      })
    })
    it('works when frames contains a null entry', function () {
      const result = sessionStore.cleanPerWindowData(
        Immutable.fromJS({
          activeFrameKey: 1,
          frames: [
            {key: 1, location: 'http://example.com'},
            null,
            {key: 2, location: 'https://brave.com'}
          ]
        })
      )
      assert.deepEqual(result.toJS(), {
        activeFrameKey: 1,
        frames: [
          {key: 1, location: 'http://example.com', src: 'http://example.com'},
          {key: 2, location: 'https://brave.com', unloaded: true, src: 'https://brave.com'}
        ]
      })
    })
    it('re-assigns the key for each item in frames', function () {
      const result = sessionStore.cleanPerWindowData(
        Immutable.fromJS({
          activeFrameKey: 22,
          frames: [
            {key: 22, location: 'http://example.com'},
            {key: 23, location: 'https://brave.com'}
          ]
        })
      )
      assert.deepEqual(result.toJS(), {
        activeFrameKey: 1,
        frames: [
          {key: 1, location: 'http://example.com', src: 'http://example.com'},
          {key: 2, location: 'https://brave.com', unloaded: true, src: 'https://brave.com'}
        ]
      })
    })
    it('clears pinned frames', function () {
      const data = Immutable.fromJS({frames: [
        {
          location: 'https://brave.com/cezar/master/ken/fight',
          pinnedLocation: 'https://brave.com/cezar/master/ken/fight'
        }, {
          key: 1,
          location: 'https://brave.com/cezar/monkey/fights/dragon',
          src: 'https://brave.com/cezar/monkey/fights/dragon',
          unloaded: true
        }
      ]})
      const result = sessionStore.cleanPerWindowData(data, true)
      assert.deepEqual(result.get('frames').toJS(), [{
        key: 1,
        location: 'https://brave.com/cezar/monkey/fights/dragon',
        src: 'https://brave.com/cezar/monkey/fights/dragon',
        unloaded: true
      }])
    })
  })

  describe('cleanAppData', function () {
    it('clears notifications from the last session', function () {
      const data = Immutable.fromJS({notifications: ['message 1', 'message 2']})
      const result = sessionStore.cleanAppData(data)
      assert.deepEqual(result.get('notifications').toJS(), [])
    })

    it('deletes temp site settings', function () {
      const data = Immutable.fromJS({temporarySiteSettings: {site1: {setting1: 'value1'}}})
      const result = sessionStore.cleanAppData(data)
      assert.deepEqual(result.get('temporarySiteSettings').toJS(), {})
    })

    describe('when CHECK_DEFAULT_ON_STARTUP is true', function () {
      it('clears defaultBrowserCheckComplete', function () {
        const data = Immutable.fromJS({
          settings: {
            [settings.CHECK_DEFAULT_ON_STARTUP]: true
          },
          defaultBrowserCheckComplete: 'test_value'
        })
        const result = sessionStore.cleanAppData(data)
        assert.equal(result.get('defaultBrowserCheckComplete'), undefined)
      })
    })

    describe('with recovery status', function () {
      it('deletes status if present', function () {
        const data = Immutable.fromJS({
          ui: {
            about: {
              preferences: { recoverySucceeded: true }
            }
          }
        })
        const result = sessionStore.cleanAppData(data)
        assert.deepEqual(result.getIn(['ui', 'about', 'preferences', 'recoverySucceeded']), undefined)
        assert.deepEqual(result.getIn(['ui', 'about', 'preferences']).toJS(), {})
      })

      it('does not throw an exception if not present', function () {
        const data = Immutable.fromJS({
          ui: {}
        })
        const result = sessionStore.cleanAppData(data)
        assert.deepEqual(result.get('ui').toJS(), {})
      })
    })

    describe('if perWindowState is present', function () {
      it('calls cleanPerWindowData for each item', function () {
        const cleanPerWindowDataStub = sinon.stub(sessionStore, 'cleanPerWindowData')
        const data = Immutable.fromJS({
          perWindowState: ['window1', 'window2']
        })
        sessionStore.cleanAppData(data, 'IS_SHUTDOWN_VALUE')
        assert.equal(cleanPerWindowDataStub.withArgs('window1', 'IS_SHUTDOWN_VALUE').calledOnce, true)
        assert.equal(cleanPerWindowDataStub.withArgs('window2', 'IS_SHUTDOWN_VALUE').calledOnce, true)
        cleanPerWindowDataStub.restore()
      })
    })

    describe('when SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA is true', function () {
      before(function () {
        shutdownClearAutocompleteData = true
      })
      after(function () {
        shutdownClearAutocompleteData = false
      })
      it('calls autofill.clearAutocompleteData', function () {
        const clearAutocompleteDataSpy = sinon.spy(fakeAutofill, 'clearAutocompleteData')
        const data = Immutable.Map()
        sessionStore.cleanAppData(data, true)
        assert.equal(clearAutocompleteDataSpy.calledOnce, true)
        clearAutocompleteDataSpy.restore()
      })

      describe('when an exception is thrown', function () {
        let clearAutocompleteDataStub
        before(function () {
          clearAutocompleteDataStub = sinon.stub(fakeAutofill, 'clearAutocompleteData').throws('lame error')
        })
        after(function () {
          clearAutocompleteDataStub.restore()
        })

        it('swallows exception', function () {
          const data = Immutable.Map()
          sessionStore.cleanAppData(data, true)
          assert.ok(true)
        })
      })
    })
    describe('when SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA is false', function () {
      let clearAutocompleteDataSpy
      before(function () {
        clearAutocompleteDataSpy = sinon.spy(fakeAutofill, 'clearAutocompleteData')
      })
      after(function () {
        clearAutocompleteDataSpy.restore()
      })
      it('does not call autofill.clearAutocompleteData', function () {
        const data = Immutable.Map()
        sessionStore.cleanAppData(data, true)
        assert.equal(clearAutocompleteDataSpy.notCalled, true)
      })
    })

    describe('when SHUTDOWN_CLEAR_AUTOFILL_DATA is true', function () {
      before(function () {
        shutdownClearAutofillData = true
      })
      after(function () {
        shutdownClearAutofillData = false
      })
      describe('happy path', function () {
        let clearAutofillDataSpy
        let result
        let clock
        let now

        before(function () {
          clearAutofillDataSpy = sinon.spy(fakeAutofill, 'clearAutofillData')
          clock = sinon.useFakeTimers()
          now = new Date(0)
          const data = Immutable.fromJS({
            autofill: {
              addresses: {
                guid: ['value1', 'value2'],
                timestamp: 'time1'
              },
              creditCards: {
                guid: ['value3', 'value4'],
                timestamp: 'time2'
              }
            }
          })
          result = sessionStore.cleanAppData(data, true)
        })

        after(function () {
          clearAutofillDataSpy.restore()
          clock.restore()
        })

        it('calls autofill.clearAutofillData', function () {
          assert.equal(clearAutofillDataSpy.calledOnce, true)
        })

        it('sets the guid for addresses to []', function () {
          assert.deepEqual(result.getIn(['autofill', 'addresses', 'guid']).toJS(), [])
        })

        it('sets the timestamp for addresses to now', function () {
          assert.equal(result.getIn(['autofill', 'addresses', 'timestamp']), now.getTime())
        })

        it('sets the guid for creditCards to []', function () {
          assert.deepEqual(result.getIn(['autofill', 'creditCards', 'guid']).toJS(), [])
        })

        it('sets the timestamp for creditCards to now', function () {
          assert.equal(result.getIn(['autofill', 'creditCards', 'timestamp']), now.getTime())
        })
      })

      describe('malformed input', function () {
        it('does not throw an exception', function () {
          sessionStore.cleanAppData(Immutable.Map(), true)
          sessionStore.cleanAppData(Immutable.fromJS({autofill: 'stringValue'}), true)
          sessionStore.cleanAppData(Immutable.fromJS({autofill: {}}), true)
          sessionStore.cleanAppData(Immutable.fromJS({autofill: {addresses: 'stringValue'}}), true)
          sessionStore.cleanAppData(Immutable.fromJS({autofill: {creditCards: 'stringValue'}}), true)
        })
      })
    })
    describe('when SHUTDOWN_CLEAR_AUTOFILL_DATA is false', function () {
      let clearAutofillDataSpy
      before(function () {
        clearAutofillDataSpy = sinon.spy(fakeAutofill, 'clearAutofillData')
        const data = Immutable.fromJS({
          autofill: {
            addresses: {
              guid: ['value1', 'value2'],
              timestamp: 'time1'
            },
            creditCards: {
              guid: ['value3', 'value4'],
              timestamp: 'time2'
            }
          }
        })
        sessionStore.cleanAppData(data, true)
      })
      after(function () {
        clearAutofillDataSpy.restore()
      })
      it('does not call autofill.clearAutofillData', function () {
        assert.equal(clearAutofillDataSpy.notCalled, true)
      })
    })

    describe('when SHUTDOWN_CLEAR_SITE_SETTINGS is true', function () {
      before(function () {
        shutdownClearSiteSettings = true
      })
      after(function () {
        shutdownClearSiteSettings = false
      })
      it('clears siteSettings', function () {
        const data = Immutable.fromJS({siteSettings: {site1: {setting1: 'value1'}}})
        const result = sessionStore.cleanAppData(data, true)
        assert.deepEqual(result.get('siteSettings').toJS(), {})
      })
    })

    describe('when SHUTDOWN_CLEAR_SITE_SETTINGS is false', function () {
      it('does not clear siteSettings', function () {
        const data = Immutable.fromJS({siteSettings: {site1: {setting1: 'value1'}}})
        const result = sessionStore.cleanAppData(data, true)
        assert.deepEqual(result.get('siteSettings').toJS(), data.get('siteSettings').toJS())
      })
    })

    describe('with siteSettings', function () {
      it('deletes Flash approval if expired', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {flash: 1, test: 2}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'site1', 'flash']), undefined)
      })

      it('leaves Flash approval alone if not expired', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {flash: Infinity, test: 2}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'site1', 'flash']), Infinity)
      })

      it('deletes NoScript approval if set', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {noScript: 1, test: 2}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'noScript']), undefined)
      })

      it('deletes NoScript exceptions', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {noScriptExceptions: true, test: 2}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'site1', 'noScriptExceptions']), undefined)
      })

      it('deletes runInsecureContent', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {runInsecureContent: true, test: 2}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'site1', 'runInsecureContent']), undefined)
      })

      it('deletes entry if empty', function () {
        const data = Immutable.fromJS({
          siteSettings: {
            site1: {}
          }
        })
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.getIn(['siteSettings', 'site1']), undefined)
      })
    })

    describe('when sites and SHUTDOWN_CLEAR_HISTORY are truthy', function () {
      before(function () {
        shutdownClearHistory = true
      })
      after(function () {
        shutdownClearHistory = false
      })

      it('calls siteUtil.clearHistory', function () {
        const clearHistorySpy = sinon.spy(siteUtil, 'clearHistory')
        const data = Immutable.fromJS({
          sites: {entry1: {}}
        })
        sessionStore.cleanAppData(data, true)
        assert.equal(clearHistorySpy.calledOnce, true)
        clearHistorySpy.restore()
      })
      it('deletes temporary entries used in about:history', function () {
        const data = Immutable.fromJS({
          about: {history: true},
          sites: {entry1: {}}
        })
        const result = sessionStore.cleanAppData(data, true)
        assert.equal(result.getIn(['about', 'history']), undefined)
      })
      it('deletes top site entries used in about:newtab', function () {
        const data = Immutable.fromJS({
          about: {newtab: true},
          sites: {entry1: {}}
        })
        const result = sessionStore.cleanAppData(data, true)
        assert.equal(result.getIn(['about', 'newtab']), undefined)
      })
    })

    describe('when downloads is truthy', function () {
      describe('when clearDownloads is true', function () {
        it('deletes downloads', function () {
          const data = Immutable.fromJS({
            downloads: {
              entry1: {}
            }
          })
          const result = sessionStore.cleanAppData(data, true)
          assert.equal(result.get('downloads'), undefined)
        })
      })

      describe('when clearDownloads is falsey', function () {
        it('deletes entries which are more than a week old', function () {
          const data = Immutable.fromJS({
            downloads: {
              entry1: {startTime: 1}
            }
          })
          const result = sessionStore.cleanAppData(data, false)
          assert.deepEqual(result.get('downloads').toJS(), {})
        })

        it('leaves entries which are less than a week old', function () {
          const data = Immutable.fromJS({
            downloads: {
              entry1: {startTime: new Date().getTime()}
            }
          })
          const result = sessionStore.cleanAppData(data, false)
          assert.deepEqual(result.get('downloads').toJS(), data.get('downloads').toJS())
        })

        describe('with download state', function () {
          const getEntry = (state) => {
            return Immutable.fromJS({
              downloads: {
                entry1: {startTime: new Date().getTime(), state}
              }
            })
          }

          it('sets IN_PROGRESS to INTERRUPTED', function () {
            const data = getEntry(downloadStates.IN_PROGRESS)
            const result = sessionStore.cleanAppData(data, false)
            assert.equal(result.getIn(['downloads', 'entry1', 'state']), downloadStates.INTERRUPTED)
          })

          it('sets PAUSED to INTERRUPTED', function () {
            const data = getEntry(downloadStates.PAUSED)
            const result = sessionStore.cleanAppData(data, false)
            assert.equal(result.getIn(['downloads', 'entry1', 'state']), downloadStates.INTERRUPTED)
          })

          it('leaves other states alone', function () {
            let data = getEntry(downloadStates.COMPLETED)
            let result = sessionStore.cleanAppData(data, false)
            assert.equal(result.getIn(['downloads', 'entry1', 'state']), downloadStates.COMPLETED)

            data = getEntry(downloadStates.CANCELLED)
            result = sessionStore.cleanAppData(data, false)
            assert.equal(result.getIn(['downloads', 'entry1', 'state']), downloadStates.CANCELLED)

            data = getEntry(downloadStates.PENDING)
            result = sessionStore.cleanAppData(data, false)
            assert.equal(result.getIn(['downloads', 'entry1', 'state']), downloadStates.PENDING)
          })
        })
      })
    })

    describe('with tabState', function () {
      it('calls getPersistentState', function () {
        const getPersistentStateSpy = sinon.spy(fakeTabState, 'getPersistentState')
        const data = Immutable.Map()
        sessionStore.cleanAppData(data)
        assert.equal(getPersistentStateSpy.calledOnce, true)
        getPersistentStateSpy.restore()
      })

      it('deletes tabState if an exception is thrown', function () {
        const getPersistentStateSpy = sinon.stub(fakeTabState, 'getPersistentState').throws('oh noes')
        const data = Immutable.fromJS({tabs: true})
        const result = sessionStore.cleanAppData(data)
        assert.deepEqual(result.get('tabs').toJS(), [])
        getPersistentStateSpy.restore()
      })
    })

    describe('with windowState', function () {
      it('calls getPersistentState', function () {
        const getPersistentStateSpy = sinon.spy(fakeWindowState, 'getPersistentState')
        const data = Immutable.Map()
        sessionStore.cleanAppData(data)
        assert.equal(getPersistentStateSpy.calledOnce, true)
        getPersistentStateSpy.restore()
      })

      it('deletes windowState if an exception is thrown', function () {
        const getPersistentStateSpy = sinon.stub(fakeWindowState, 'getPersistentState').throws('oh noes')
        const data = Immutable.fromJS({windows: true})
        const result = sessionStore.cleanAppData(data)
        assert.equal(result.windows, undefined)
        getPersistentStateSpy.restore()
      })
    })

    describe('with data.extensions', function () {
    })
  })

  describe('cleanSessionDataOnShutdown', function () {
  })

  describe('loadAppState', function () {
    let runPreMigrationsSpy
    let cleanAppDataStub
    let defaultAppStateSpy
    let runPostMigrationsSpy
    let localeInitSpy
    let backupSessionStub
    let runImportDefaultSettings

    before(function () {
      runPreMigrationsSpy = sinon.spy(sessionStore, 'runPreMigrations')
      cleanAppDataStub = sinon.stub(sessionStore, 'cleanAppData', (data) => data)
      defaultAppStateSpy = sinon.spy(sessionStore, 'defaultAppState')
      runPostMigrationsSpy = sinon.spy(sessionStore, 'runPostMigrations')
      localeInitSpy = sinon.spy(fakeLocale, 'init')
      backupSessionStub = sinon.stub(sessionStore, 'backupSession')
      runImportDefaultSettings = sinon.spy(sessionStore, 'runImportDefaultSettings')
    })

    after(function () {
      cleanAppDataStub.restore()
      runPreMigrationsSpy.restore()
      defaultAppStateSpy.restore()
      runPostMigrationsSpy.restore()
      localeInitSpy.restore()
      backupSessionStub.restore()
    })

    describe('when reading the session file', function () {
      describe('happy path', function () {
        let readFileSyncSpy

        before(function () {
          readFileSyncSpy = sinon.spy(fakeFileSystem, 'readFileSync')
        })

        after(function () {
          readFileSyncSpy.restore()
        })

        it('calls fs.readFileSync', function () {
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(readFileSyncSpy.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })

      describe('when exception is thrown', function () {
        let readFileSyncStub

        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').throws('error reading file')
        })

        after(function () {
          readFileSyncStub.restore()
        })

        it('does not crash when exception thrown during read', function () {
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.ok(result.get('firstRunTimestamp'))
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })
    })

    describe('when calling JSON.parse', function () {
      describe('exception is thrown', function () {
        let readFileSyncStub

        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').returns('this is not valid JSON')
        })

        after(function () {
          readFileSyncStub.restore()
        })

        it('does not call runPreMigrations', function () {
          runPreMigrationsSpy.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(runPreMigrationsSpy.notCalled, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })

        it('does not call cleanAppData', function () {
          cleanAppDataStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(cleanAppDataStub.notCalled, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })

        it('calls defaultAppState to get a default app state', function () {
          defaultAppStateSpy.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(defaultAppStateSpy.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })

        it('does not call runPostMigrations', function () {
          runPostMigrationsSpy.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(runPostMigrationsSpy.notCalled, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })

        it('calls backupSessionStub', function () {
          backupSessionStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(backupSessionStub.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })

        it('calls runImportDefaultSettings', function () {
          runImportDefaultSettings.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(runImportDefaultSettings.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })
    })

    it('calls runPreMigrations', function () {
      runPreMigrationsSpy.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(runPreMigrationsSpy.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + result)
        })
    })

    describe('when checking data.cleanedOnShutdown', function () {
      let readFileSyncStub

      describe('when true', function () {
        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').returns(JSON.stringify({
            cleanedOnShutdown: true,
            lastAppVersion: fakeElectron.app.getVersion()
          }))
        })
        after(function () {
          readFileSyncStub.restore()
        })
        it('does not call cleanAppData', function () {
          cleanAppDataStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(cleanAppDataStub.notCalled, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })

      describe('when NOT true', function () {
        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').returns(JSON.stringify({
            cleanedOnShutdown: false,
            lastAppVersion: fakeElectron.app.getVersion()
          }))
        })
        after(function () {
          readFileSyncStub.restore()
        })
        it('calls cleanAppData', function () {
          cleanAppDataStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(cleanAppDataStub.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })
    })

    describe('when checking data.lastAppVersion', function () {
      let readFileSyncStub

      describe('when it matches app.getVersion', function () {
        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').returns(JSON.stringify({
            cleanedOnShutdown: true,
            lastAppVersion: fakeElectron.app.getVersion()
          }))
        })
        after(function () {
          readFileSyncStub.restore()
        })
        it('does not call cleanAppData', function () {
          cleanAppDataStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(cleanAppDataStub.notCalled, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })

      describe('when it does NOT match app.getVersion', function () {
        before(function () {
          readFileSyncStub = sinon.stub(fakeFileSystem, 'readFileSync').returns(JSON.stringify({
            cleanedOnShutdown: true,
            lastAppVersion: 'NOT A REAL VERSION'
          }))
        })
        after(function () {
          readFileSyncStub.restore()
        })
        it('calls cleanAppData', function () {
          cleanAppDataStub.reset()
          return sessionStore.loadAppState()
            .then(function (result) {
              assert.equal(cleanAppDataStub.calledOnce, true)
            }, function (result) {
              assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
            })
        })
      })
    })

    it('calls defaultAppState', function () {
      defaultAppStateSpy.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(defaultAppStateSpy.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
        })
    })

    it('calls runPostMigrations', function () {
      runPostMigrationsSpy.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(runPostMigrationsSpy.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
        })
    })

    it('calls runImportDefaultSettings', function () {
      runImportDefaultSettings.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(runImportDefaultSettings.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
        })
    })

    it('calls locale.init', function () {
      localeInitSpy.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(localeInitSpy.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
        })
    })
  })

  describe('backupSession', function () {
    let copySyncSpy
    let existsSyncStub
    before(function () {
      copySyncSpy = sinon.spy(fakeFileSystem, 'copySync')
    })
    after(function () {
      copySyncSpy.restore()
    })

    describe('when session exists', function () {
      before(function () {
        existsSyncStub = sinon.stub(fakeFileSystem, 'existsSync').returns(true)
        copySyncSpy.reset()
        sessionStore.backupSession()
      })
      after(function () {
        existsSyncStub.restore()
      })
      it('calls fs.existsSync', function () {
        assert.equal(existsSyncStub.calledOnce, true)
      })
      it('calls fs.copySync', function () {
        assert.equal(copySyncSpy.calledOnce, true)
      })
    })

    describe('when session does not exist', function () {
      before(function () {
        existsSyncStub = sinon.stub(fakeFileSystem, 'existsSync').returns(false)
        copySyncSpy.reset()
        sessionStore.backupSession()
      })
      after(function () {
        existsSyncStub.restore()
      })
      it('calls fs.existsSync', function () {
        assert.equal(existsSyncStub.calledOnce, true)
      })
      it('does not call fs.copySync', function () {
        assert.equal(copySyncSpy.notCalled, true)
      })
    })
  })

  describe('defaultAppState', function () {
    describe('when NODE_ENV is not `test`', function () {
      let prevNodeEnv
      before(function () {
        prevNodeEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
      })
      after(function () {
        process.env.NODE_ENV = prevNodeEnv
      })
      it('sets showOnLoad to true (which triggers about:welcome)', function () {
        const defaultAppState = sessionStore.defaultAppState()
        assert.equal(defaultAppState.about.welcome.showOnLoad, true)
      })
    })
  })

  describe('isProtocolHandled', function () {
  })

  describe('runImportDefaultSettings', function () {
    const { defaultSiteSettingsList } = require('../../../js/data/siteSettingsList')
    const defaultAppState = {
      siteSettings: {}
    }
    it('check defaultSiteSettingsListImported', function () {
      assert.deepEqual(sessionStore.runImportDefaultSettings({defaultSiteSettingsListImported: true}), {defaultSiteSettingsListImported: true})
    })
    it('import to default app state', function () {
      const result = sessionStore.runImportDefaultSettings(defaultAppState)
      for (var i = 0; i < defaultSiteSettingsList.length; ++i) {
        assert.equal(result.siteSettings.hasOwnProperty(defaultSiteSettingsList[i].pattern), true)
        const setting = result.siteSettings[defaultSiteSettingsList[i].pattern]
        assert.equal(setting[defaultSiteSettingsList[i].name], defaultSiteSettingsList[i].value)
      }
    })
    it('import to existing app state', function () {
      if (defaultSiteSettingsList.length >= 2) {
        let conflictedAppstate = defaultAppState
        conflictedAppstate.siteSettings[defaultSiteSettingsList[0].pattern] = {}
        conflictedAppstate.siteSettings[defaultSiteSettingsList[1].pattern] = {}
        let conflictedSetting = conflictedAppstate.siteSettings[defaultSiteSettingsList[0].pattern]
        let sameSetting = conflictedAppstate.siteSettings[defaultSiteSettingsList[1].pattern]
        conflictedSetting[defaultSiteSettingsList[0].name] = 'BRAVE'
        sameSetting[defaultSiteSettingsList[1].name] = defaultSiteSettingsList[1].value
        const result = sessionStore.runImportDefaultSettings(conflictedAppstate)
        for (var i = 1; i < defaultSiteSettingsList.length; ++i) {
          assert.equal(result.siteSettings.hasOwnProperty(defaultSiteSettingsList[i].pattern), true)
          const setting = result.siteSettings[defaultSiteSettingsList[i].pattern]
          assert.equal(setting[defaultSiteSettingsList[i].name], defaultSiteSettingsList[i].value)
        }
        assert.equal(result.siteSettings.hasOwnProperty(defaultSiteSettingsList[0].pattern), true)
        const setting = result.siteSettings[defaultSiteSettingsList[0].pattern]
        assert.equal(setting[defaultSiteSettingsList[0].name], 'BRAVE')
      }
    })
  })

  describe('runPreMigrations', function () {
    let data
    let runPreMigrations

    before(function () {
      const defaultAppState = sessionStore.defaultAppState()
      // NOTE: it's important that this merges similar to loadAppState
      // It's immutable since runPreMigrations does delete values
      data = Immutable.fromJS(Object.assign({}, defaultAppState, {
        autofill: {
          addresses: ['guid1', 'guid2'],
          creditCards: ['guid1', 'guid2']
        },
        settings: {
          [settings.DEFAULT_SEARCH_ENGINE]: 'content/search/google.xml',
          [settings.AUTO_SUGGEST_SITES]: 'sure thing',
          [settings.MINIMUM_VISIT_TIME]: 'almost instantly',
          [settings.MINIMUM_VISITS]: 'a million',
          [settings.HIDE_LOWER_SITES]: 'pls do it',
          [settings.HIDE_EXCLUDED_SITES]: 'no thanks',
          'payments.notificationTryPaymentsDismissed': 'why would I?'
        }
      }))
      runPreMigrations = sessionStore.runPreMigrations(data.toJS())
    })

    describe('when `data.autofill` exists', function () {
      describe('migrate `data.autofill.addresses` from array to map', function () {
        it('copies the values into a field called guid', function () {
          const oldValue = data.getIn(['autofill', 'addresses'])
          const newValue = runPreMigrations.autofill.addresses.guid
          assert.deepEqual(newValue, oldValue.toJS())
        })
        it('converts the value to a map', function () {
          assert.equal(Array.isArray(runPreMigrations.autofill.addresses), false)
        })
      })

      describe('migrate `data.autofill.creditCards` from array to map', function () {
        it('copies the values into a field called guid', function () {
          const oldValue = data.getIn(['autofill', 'creditCards'])
          const newValue = runPreMigrations.autofill.creditCards.guid
          assert.deepEqual(newValue, oldValue.toJS())
        })
        it('converts the value to a map', function () {
          assert.equal(Array.isArray(runPreMigrations.autofill.creditCards), false)
        })
      })

      describe('updates guids in `data.autofill.addresses.guid` if they are an object', function () {
        // TODO:
      })

      describe('updates guids in `data.autofill.creditCards.guid` if they are an object', function () {
        // TODO:
      })
    })

    describe('when `data.settings` exists', function () {
      describe('migrate search engine settings', function () {
        it('updates settings.DEFAULT_SEARCH_ENGINE if set to google.xml', function () {
          const newValue = runPreMigrations.settings[settings.DEFAULT_SEARCH_ENGINE]
          assert.equal(newValue, 'Google')
        })
        it('updates settings.DEFAULT_SEARCH_ENGINE if set to duckduckgo.xml', function () {
          // this one has to run a second time, since it modifies the same value as test before
          const dataCopy = data.setIn(['settings', settings.DEFAULT_SEARCH_ENGINE], 'content/search/duckduckgo.xml')
          const output = sessionStore.runPreMigrations(dataCopy.toJS())
          const newValue = output.settings[settings.DEFAULT_SEARCH_ENGINE]
          assert.equal(newValue, 'DuckDuckGo')
        })
      })

      describe('payments migration', function () {
        it('sets PAYMENTS_SITES_AUTO_SUGGEST based on AUTO_SUGGEST_SITES', function () {
          const oldValue = data.getIn(['settings', settings.AUTO_SUGGEST_SITES])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_AUTO_SUGGEST]
          assert.equal(newValue, oldValue)
        })
        it('sets PAYMENTS_MINIMUM_VISIT_TIME based on MINIMUM_VISIT_TIME', function () {
          const oldValue = data.getIn(['settings', settings.MINIMUM_VISIT_TIME])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_MINIMUM_VISIT_TIME]
          assert.equal(newValue, oldValue)
        })
        it('sets PAYMENTS_MINIMUM_VISITS based on MINIMUM_VISITS', function () {
          const oldValue = data.getIn(['settings', settings.MINIMUM_VISITS])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_MINIMUM_VISITS]
          assert.equal(newValue, oldValue)
        })
        it('sets PAYMENTS_SITES_SHOW_LESS based on HIDE_LOWER_SITES', function () {
          const oldValue = data.getIn(['settings', settings.HIDE_LOWER_SITES])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_SHOW_LESS]
          assert.equal(newValue, oldValue)
        })
        it('sets PAYMENTS_SITES_HIDE_EXCLUDED based on HIDE_EXCLUDED_SITES', function () {
          const oldValue = data.getIn(['settings', settings.HIDE_EXCLUDED_SITES])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_HIDE_EXCLUDED]
          assert.equal(newValue, oldValue)
        })
        it('sets PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED based on payments.notificationTryPaymentsDismissed', function () {
          const oldValue = data.getIn(['settings', 'payments.notificationTryPaymentsDismissed'])
          const newValue = runPreMigrations.settings[settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED]
          assert.equal(newValue, oldValue)
        })
        it('removes the old values', function () {
          assert.equal(runPreMigrations.settings[settings.AUTO_SUGGEST_SITES], undefined)
          assert.equal(runPreMigrations.settings[settings.MINIMUM_VISIT_TIME], undefined)
          assert.equal(runPreMigrations.settings[settings.MINIMUM_VISITS], undefined)
          assert.equal(runPreMigrations.settings[settings.HIDE_LOWER_SITES], undefined)
          assert.equal(runPreMigrations.settings[settings.HIDE_EXCLUDED_SITES], undefined)
          assert.equal(runPreMigrations.settings['payments.notificationTryPaymentsDismissed'], undefined)
        })
      })
    })
  })

  describe('runPostMigrations', function () {
    describe('sites trailing slash migration', function () {
      it('site with trailing slash', function () {
        const data = Immutable.fromJS({
          sites: {
            'https://brave.com/|0|0': {
              location: 'https://brave.com/',
              partitionNumber: 0
            }
          }
        })
        const expectedResult = Immutable.fromJS({
          sites: {
            'https://brave.com|0|0': {
              location: 'https://brave.com/',
              partitionNumber: 0
            }
          }
        })
        const result = sessionStore.runPostMigrations(data)
        assert.deepEqual(result.toJS(), expectedResult.toJS())
      })
      it('site without trailing slash', function () {
        const data = Immutable.fromJS({
          sites: {
            'https://brave.com|0|0': {
              location: 'https://brave.com',
              partitionNumber: 0
            }
          }
        })
        const result = sessionStore.runPostMigrations(data)
        assert.deepEqual(result.toJS(), data.toJS())
      })
      it('site is folder', function () {
        const data = Immutable.fromJS({
          sites: {
            '2': {
              title: 'Brave',
              folderId: 2,
              order: 10
            }
          }
        })
        const result = sessionStore.runPostMigrations(data)
        assert.deepEqual(result.toJS(), data.toJS())
      })
      it('invalid site entry', function () {
        const data = Immutable.fromJS({
          sites: {
            'https://brave.com/|0|0': {
              favicon: 'https://brave.com/bat.ico'
            }
          }
        })
        const expectedResult = {
          sites: {}
        }
        const result = sessionStore.runPostMigrations(data)
        assert.deepEqual(result.toJS(), expectedResult)
      })
    })
    describe('locationSiteKeysCache trailing slash migration', function () {
      it('triggered by invalid site entry', function () {
        const data = Immutable.fromJS({
          sites: {
            'https://brave.com/|0|0': {
              favicon: 'https://brave.com/bat.ico'
            }
          },
          locationSiteKeysCache: {
            'https://brave.com/': [
              'https://brave.com/|0|0',
              'https://brave.com|0|0'
            ]
          }
        })
        const expectedResult = {
          sites: {},
          locationSiteKeysCache: {
            'https://brave.com/': [
              'https://brave.com|0|0'
            ]
          }
        }
        const result = sessionStore.runPostMigrations(data)
        assert.deepEqual(result.toJS(), expectedResult)
      })
    })
  })
})
