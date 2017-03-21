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
  const fakeAutofill = {
    init: () => {},
    addAutofillAddress: () => {},
    removeAutofillAddress: () => {},
    addAutofillCreditCard: () => {},
    removeAutofillCreditCard: () => {},
    clearAutocompleteData: () => {},
    clearAutofillData: () => {}
  }
  const fakeTabState = {
    getPersistentState: (data) => { return makeImmutable(data) }
  }
  const fakeWindowState = {
    getPersistentState: (data) => { return makeImmutable(data) }
  }
  const fakeFileSystem = {
    readFileSync: (path) => {
      return '{"cleanedOnShutdown": false}'
    },
    writeFile: (path, options, callback) => {
      console.log('calling mocked fs.writeFile')
      callback()
    },
    rename: (oldPath, newPath, callback) => {
      console.log('calling mocked fs.rename')
      callback()
    }
  }
  const mockSiteUtil = {
    clearHistory: (sites, syncCallback) => {
      return siteUtil.clearHistory(sites, syncCallback)
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
    mockery.registerMock('fs', fakeFileSystem)
    mockery.registerMock('electron', require('../lib/fakeElectron'))
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
      }, function (result) {
        console.log('failed: ', result)
        assert.fail()
      })
    })

    describe('with isShutdown', function () {
      it('calls cleanSessionDataOnShutdown if true', function () {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState({}, true)
        .then(() => {
          assert.equal(cleanSessionDataOnShutdownStub.calledOnce, true)
        }, function (result) {
          console.log('failed: ', result)
          assert.fail()
        })
      })

      it('does not call cleanSessionDataOnShutdown if false', function () {
        cleanSessionDataOnShutdownStub.reset()
        return sessionStore.saveAppState({}, false)
        .then(() => {
          assert.equal(cleanSessionDataOnShutdownStub.notCalled, true)
        }, function (result) {
          console.log('failed: ', result)
          assert.fail()
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

    it('calls tabState.getPersistentState', function () {
      const getPersistentStateSpy = sinon.spy(fakeTabState, 'getPersistentState')
      const data = {}
      sessionStore.cleanAppData(data)
      assert.equal(getPersistentStateSpy.calledOnce, true)
      getPersistentStateSpy.restore()
    })

    it('calls windowState.getPersistentState', function () {
      const getPersistentStateSpy = sinon.spy(fakeWindowState, 'getPersistentState')
      const data = {}
      sessionStore.cleanAppData(data)
      assert.equal(getPersistentStateSpy.calledOnce, true)
      getPersistentStateSpy.restore()
    })

    describe('with data.extensions', function () {
    })
  })

  describe('cleanSessionDataOnShutdown', function () {
  })

  describe('loadAppState', function () {
    let cleanAppDataStub
    before(function () {
      cleanAppDataStub = sinon.stub(sessionStore, 'cleanAppData')
    })

    after(function () {
      cleanAppDataStub.restore()
    })

    it('calls cleanAppData if data.cleanedOnShutdown !== true', function () {
      return sessionStore.loadAppState()
      .then(function (result) {
        assert.equal(cleanAppDataStub.calledOnce, true)
      }, function (result) {
        console.log('failed: ', result)
        assert.fail()
      })
    })
  })

  describe('defaultAppState', function () {
  })

  describe('isProtocolHandled', function () {
  })
})
