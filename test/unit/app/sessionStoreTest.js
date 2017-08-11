/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const settings = require('../../../js/constants/settings')
const {makeImmutable} = require('../../../app/common/state/immutableUtil')
const downloadStates = require('../../../js/constants/downloadStates')

require('../braveUnit')

describe('sessionStore unit tests', function () {
  let sessionStore
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
  const fakeFileSystem = {
    readFileSync: (path) => {
      return JSON.stringify({
        cleanedOnShutdown: false
      })
    },
    writeFile: (path, options, callback) => {
      console.log('calling mocked fs.writeFile')
      callback()
    },
    rename: (oldPath, newPath, callback) => {
      console.log('calling mocked fs.rename')
      callback()
    },
    copySync: (oldPath, newPath) => {
      console.log('calling mocked fs.copySync')
    },
    existsSync: (path) => {
      console.log('calling mocked fs.existsSync')
      return true
    }
  }
  const fakeLocale = {
    init: (language) => {
      return new Promise((resolve, reject) => {
        resolve()
      })
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
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./locale', fakeLocale)
    mockery.registerMock('./autofill', fakeAutofill)
    mockery.registerMock('./common/state/tabState', fakeTabState)
    mockery.registerMock('./common/state/windowState', fakeWindowState)
    mockery.registerMock('../js/settings', { getSetting: (settingKey, settingsCollection, value) => {
      switch (settingKey) {
        default: return true
      }
    }})
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

    describe('when clearAutocompleteData is true', function () {
      it('calls autofill.clearAutocompleteData', function () {
        const clearAutocompleteDataSpy = sinon.spy(fakeAutofill, 'clearAutocompleteData')
        const data = Immutable.Map()
        sessionStore.cleanAppData(data, true)
        assert.equal(clearAutocompleteDataSpy.calledOnce, true)
        clearAutocompleteDataSpy.restore()
      })

      describe('exception is thrown', function () {
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

    describe('when clearAutofillData is true', function () {
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

    describe('when clearSiteSettings is true', function () {
      it('clears siteSettings', function () {
        const data = Immutable.fromJS({siteSettings: {site1: {setting1: 'value1'}}})
        const result = sessionStore.cleanAppData(data, true)
        assert.deepEqual(result.get('siteSettings').toJS(), {})
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

    describe('when sites and clearHistory are truthy', function () {
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
    let data = {
      settings: {
        [settings.AUTO_SUGGEST_SITES]: 'sure thing',
        [settings.MINIMUM_VISIT_TIME]: 'almost instantly',
        [settings.MINIMUM_VISITS]: 'a million',
        [settings.HIDE_LOWER_SITES]: 'pls do it',
        [settings.HIDE_EXCLUDED_SITES]: 'no thanks',
        'payments.notificationTryPaymentsDismissed': 'why would I?'
      }
    }

    describe('if data.settings exist', function () {
      it('PAYMENTS_SITES_AUTO_SUGGEST inherits data from AUTO_SUGGEST_SITES', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_AUTO_SUGGEST]
        const oldValue = runPreMigrations.settings[settings.AUTO_SUGGEST_SITES]
        assert.equal(newValue, oldValue)
      })
      it('PAYMENTS_MINIMUM_VISIT_TIME inherits data from MINIMUM_VISIT_TIME', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_MINIMUM_VISIT_TIME]
        const oldValue = runPreMigrations.settings[settings.MINIMUM_VISIT_TIME]
        assert.equal(newValue, oldValue)
      })
      it('PAYMENTS_MINIMUM_VISITS inherits data from MINIMUM_VISITS', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_MINIMUM_VISITS]
        const oldValue = runPreMigrations.settings[settings.MINIMUM_VISITS]
        assert.equal(newValue, oldValue)
      })
      it('PAYMENTS_SITES_SHOW_LESS inherits data from HIDE_LOWER_SITES', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_SHOW_LESS]
        const oldValue = runPreMigrations.settings[settings.HIDE_LOWER_SITES]
        assert.equal(newValue, oldValue)
      })
      it('PAYMENTS_SITES_HIDE_EXCLUDED inherits data from HIDE_EXCLUDED_SITES', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_SITES_HIDE_EXCLUDED]
        const oldValue = runPreMigrations.settings[settings.HIDE_EXCLUDED_SITES]
        assert.equal(newValue, oldValue)
      })
      it('PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED inherits data from payments.notificationTryPaymentsDismissed', function () {
        const runPreMigrations = sessionStore.runPreMigrations(data)
        const newValue = runPreMigrations.settings[settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED]
        const oldValue = runPreMigrations.settings['payments.notificationTryPaymentsDismissed']
        assert.equal(newValue, oldValue)
      })
    })
  })
})
