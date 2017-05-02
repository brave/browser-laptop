/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const settings = require('../../../js/constants/settings')
const {makeImmutable} = require('../../../app/common/state/immutableUtil')
const downloadStates = require('../../../js/constants/downloadStates')
const siteUtil = require('../../../js/state/siteUtil')

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
    clearCache: () => {}
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
  const mockSiteUtil = {
    clearHistory: (sites) => {
      return siteUtil.clearHistory(sites)
    },
    getSiteKey: (siteDetail) => {
      return siteUtil.getSiteKey(siteDetail)
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
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./locale', fakeLocale)
    mockery.registerMock('../js/state/siteUtil', mockSiteUtil)
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
      cleanAppDataStub = sinon.stub(sessionStore, 'cleanAppData').returns({})
      cleanSessionDataOnShutdownStub = sinon.stub(sessionStore, 'cleanSessionDataOnShutdown')
    })

    after(function () {
      cleanAppDataStub.restore()
      cleanSessionDataOnShutdownStub.restore()
    })

    it('calls cleanAppData', function () {
      cleanAppDataStub.reset()
      return sessionStore.saveAppState({})
        .then(function (result) {
          assert.equal(cleanAppDataStub.calledOnce, true)
        }, function (err) {
          assert(!err)
        })
    })

    describe('with isShutdown', function () {
      it('calls cleanSessionDataOnShutdown if true', function () {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState({}, true)
          .then(() => {
            assert.equal(cleanSessionDataOnShutdownStub.calledOnce, true)
          }, function (err) {
            assert(!err)
          })
      })

      it('does not call cleanSessionDataOnShutdown if false', function () {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState({}, false)
          .then(() => {
            assert.equal(cleanSessionDataOnShutdownStub.notCalled, true)
          }, function (err) {
            assert(!err)
          })
      })
    })
  })

  describe('cleanPerWindowData', function () {
  })

  describe('cleanAppData', function () {
    it('clears notifications from the last session', function () {
      const data = {notifications: ['message 1', 'message 2']}
      const result = sessionStore.cleanAppData(data)
      assert.deepEqual(result.notifications, [])
    })

    it('deletes temp site settings', function () {
      const data = {temporarySiteSettings: {site1: {setting1: 'value1'}}}
      const result = sessionStore.cleanAppData(data)
      assert.deepEqual(result.temporarySiteSettings, {})
    })

    describe('when CHECK_DEFAULT_ON_STARTUP is true', function () {
      it('clears defaultBrowserCheckComplete', function () {
        const data = {
          settings: {},
          defaultBrowserCheckComplete: 'test_value'
        }
        data.settings[settings.CHECK_DEFAULT_ON_STARTUP] = true
        const result = sessionStore.cleanAppData(data)
        assert.equal(result.defaultBrowserCheckComplete, undefined)
      })
    })

    describe('with recovery status', function () {
      it('deletes status if present', function () {
        const data = {
          ui: {
            about: {
              preferences: { recoverySucceeded: true }
            }
          }
        }
        const result = sessionStore.cleanAppData(data)
        assert.deepEqual(result.ui.about.preferences.recoverySucceeded, undefined)
        assert.deepEqual(result.ui.about.preferences, {})
      })

      it('does not throw an exception if not present', function () {
        const data = {
          ui: {}
        }
        const result = sessionStore.cleanAppData(data)
        assert.deepEqual(result.ui, {})
      })
    })

    describe('if perWindowState is present', function () {
      it('calls cleanPerWindowData for each item', function () {
        const cleanPerWindowDataStub = sinon.stub(sessionStore, 'cleanPerWindowData')
        const data = {
          perWindowState: ['window1', 'window2']
        }
        sessionStore.cleanAppData(data, 'IS_SHUTDOWN_VALUE')
        assert.equal(cleanPerWindowDataStub.withArgs('window1', 'IS_SHUTDOWN_VALUE').calledOnce, true)
        assert.equal(cleanPerWindowDataStub.withArgs('window2', 'IS_SHUTDOWN_VALUE').calledOnce, true)
        cleanPerWindowDataStub.restore()
      })
    })

    describe('when clearAutocompleteData is true', function () {
      it('calls autofill.clearAutocompleteData', function () {
        const clearAutocompleteDataSpy = sinon.spy(fakeAutofill, 'clearAutocompleteData')
        const data = {}
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
          const data = {}
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
          const data = {
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
          }
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
          assert.deepEqual(result.autofill.addresses.guid, [])
        })

        it('sets the timestamp for addresses to now', function () {
          assert.equal(result.autofill.addresses.timestamp, now.getTime())
        })

        it('sets the guid for creditCards to []', function () {
          assert.deepEqual(result.autofill.creditCards.guid, [])
        })

        it('sets the timestamp for creditCards to now', function () {
          assert.equal(result.autofill.creditCards.timestamp, now.getTime())
        })
      })

      describe('malformed input', function () {
        it('does not throw an exception', function () {
          sessionStore.cleanAppData({}, true)
          sessionStore.cleanAppData({autofill: 'stringValue'}, true)
          sessionStore.cleanAppData({autofill: {}}, true)
          sessionStore.cleanAppData({autofill: {addresses: 'stringValue'}}, true)
          sessionStore.cleanAppData({autofill: {creditCards: 'stringValue'}}, true)
        })
      })
    })

    describe('when clearSiteSettings is true', function () {
      it('clears siteSettings', function () {
        const data = {siteSettings: {site1: {setting1: 'value1'}}}
        const result = sessionStore.cleanAppData(data, true)
        assert.deepEqual(result.siteSettings, {})
      })
    })

    describe('with siteSettings', function () {
      it('deletes Flash approval if expired', function () {
        const data = {
          siteSettings: {
            site1: {flash: 1, test: 2}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.site1.flash, undefined)
      })

      it('leaves Flash approval alone if not expired', function () {
        const data = {
          siteSettings: {
            site1: {flash: Infinity, test: 2}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.site1.flash, Infinity)
      })

      it('deletes NoScript approval if set', function () {
        const data = {
          siteSettings: {
            site1: {noScript: 1, test: 2}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.noScript, undefined)
      })

      it('deletes NoScript exceptions', function () {
        const data = {
          siteSettings: {
            site1: {noScriptExceptions: true, test: 2}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.site1.noScriptExceptions, undefined)
      })

      it('deletes runInsecureContent', function () {
        const data = {
          siteSettings: {
            site1: {runInsecureContent: true, test: 2}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.site1.runInsecureContent, undefined)
      })

      it('deletes entry if empty', function () {
        const data = {
          siteSettings: {
            site1: {}
          }
        }
        const result = sessionStore.cleanAppData(data, false)
        assert.equal(result.siteSettings.site1, undefined)
      })
    })

    describe('when sites and clearHistory are truthy', function () {
      it('calls siteUtil.clearHistory', function () {
        const clearHistorySpy = sinon.spy(siteUtil, 'clearHistory')
        const data = {
          sites: {entry1: {}}
        }
        sessionStore.cleanAppData(data, true)
        assert.equal(clearHistorySpy.calledOnce, true)
        clearHistorySpy.restore()
      })
      it('deletes temporary entries used in about:history', function () {
        const data = {
          about: {history: true},
          sites: {entry1: {}}
        }
        const result = sessionStore.cleanAppData(data, true)
        assert.equal(result.about.history, undefined)
      })
      it('deletes top site entries used in about:newtab', function () {
        const data = {
          about: {newtab: true},
          sites: {entry1: {}}
        }
        const result = sessionStore.cleanAppData(data, true)
        assert.equal(result.about.newtab, undefined)
      })
    })

    describe('when downloads is truthy', function () {
      describe('when clearDownloads is true', function () {
        it('deletes downloads', function () {
          const data = {
            downloads: {
              entry1: {}
            }
          }
          const result = sessionStore.cleanAppData(data, true)
          assert.equal(result.downloads, undefined)
        })
      })

      describe('when clearDownloads is falsey', function () {
        it('deletes entries which are more than a week old', function () {
          const data = {
            downloads: {
              entry1: {startTime: 1}
            }
          }
          const result = sessionStore.cleanAppData(data, false)
          assert.deepEqual(result.downloads, {})
        })

        it('leaves entries which are less than a week old', function () {
          const data = {
            downloads: {
              entry1: {startTime: new Date().getTime()}
            }
          }
          const result = sessionStore.cleanAppData(data, false)
          assert.deepEqual(result.downloads, data.downloads)
        })

        describe('with download state', function () {
          const getEntry = (state) => {
            return {
              downloads: {
                entry1: {startTime: new Date().getTime(), state: state}
              }
            }
          }

          it('sets IN_PROGRESS to INTERRUPTED', function () {
            const data = getEntry(downloadStates.IN_PROGRESS)
            const result = sessionStore.cleanAppData(data, false)
            assert.equal(result.downloads.entry1.state, downloadStates.INTERRUPTED)
          })

          it('sets PAUSED to INTERRUPTED', function () {
            const data = getEntry(downloadStates.PAUSED)
            const result = sessionStore.cleanAppData(data, false)
            assert.equal(result.downloads.entry1.state, downloadStates.INTERRUPTED)
          })

          it('leaves other states alone', function () {
            let data = getEntry(downloadStates.COMPLETED)
            let result = sessionStore.cleanAppData(data, false)
            assert.equal(result.downloads.entry1.state, downloadStates.COMPLETED)

            data = getEntry(downloadStates.CANCELLED)
            result = sessionStore.cleanAppData(data, false)
            assert.equal(result.downloads.entry1.state, downloadStates.CANCELLED)

            data = getEntry(downloadStates.PENDING)
            result = sessionStore.cleanAppData(data, false)
            assert.equal(result.downloads.entry1.state, downloadStates.PENDING)
          })
        })
      })
    })

    describe('with tabState', function () {
      it('calls getPersistentState', function () {
        const getPersistentStateSpy = sinon.spy(fakeTabState, 'getPersistentState')
        const data = {}
        sessionStore.cleanAppData(data)
        assert.equal(getPersistentStateSpy.calledOnce, true)
        getPersistentStateSpy.restore()
      })

      it('deletes tabState if an exception is thrown', function () {
        const getPersistentStateSpy = sinon.stub(fakeTabState, 'getPersistentState').throws('oh noes')
        const data = {tabs: true}
        const result = sessionStore.cleanAppData(data)
        assert.equal(result.tabs, undefined)
        getPersistentStateSpy.restore()
      })
    })

    describe('with windowState', function () {
      it('calls getPersistentState', function () {
        const getPersistentStateSpy = sinon.spy(fakeWindowState, 'getPersistentState')
        const data = {}
        sessionStore.cleanAppData(data)
        assert.equal(getPersistentStateSpy.calledOnce, true)
        getPersistentStateSpy.restore()
      })

      it('deletes windowState if an exception is thrown', function () {
        const getPersistentStateSpy = sinon.stub(fakeWindowState, 'getPersistentState').throws('oh noes')
        const data = {windows: true}
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

    before(function () {
      runPreMigrationsSpy = sinon.spy(sessionStore, 'runPreMigrations')
      cleanAppDataStub = sinon.stub(sessionStore, 'cleanAppData')
      defaultAppStateSpy = sinon.spy(sessionStore, 'defaultAppState')
      runPostMigrationsSpy = sinon.spy(sessionStore, 'runPostMigrations')
      localeInitSpy = sinon.spy(fakeLocale, 'init')
      backupSessionStub = sinon.stub(sessionStore, 'backupSession')
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
              assert.ok(result.firstRunTimestamp)
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
      })
    })

    it('calls runPreMigrations', function () {
      runPreMigrationsSpy.reset()
      return sessionStore.loadAppState()
        .then(function (result) {
          assert.equal(runPreMigrationsSpy.calledOnce, true)
        }, function (result) {
          assert.ok(false, 'promise was rejected: ' + JSON.stringify(result))
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
  })

  describe('isProtocolHandled', function () {
  })
})
