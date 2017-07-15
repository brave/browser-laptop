/* global describe, before, beforeEach, after, it, afterEach */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const messages = require('../../../js/constants/messages')

let isWindows = false
let isDarwin = false

require('../braveUnit')

const makeSender = (fakeWindow) => ({
  sender: {
    getOwnerBrowserWindow: function () {
      return {
        id: fakeWindow.id
      }
    }
  }
})

describe('sessionStoreShutdown unit tests', function () {
  let sessionStore
  let sessionStoreShutdown
  let appActions
  let appStore
  const fakeElectron = Object.assign({}, require('../lib/fakeElectron'))
  const FakeWindow = require('../lib/fakeWindow')
  const fakeAdBlock = require('../lib/fakeAdBlock')

  before(function () {
    this.clock = sinon.useFakeTimers()
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    global.muon = {
      file: {
        writeImportant: (path, data, cb) => {
          // simulate running on another thread
          setTimeout(() => {
            cb(true)
          }, 0)
        }
      }
    }

    const platformUtil = require('../../../app/common/lib/platformUtil')
    this.isWindowsStub = sinon.stub(platformUtil, 'isWindows', () => isWindows)
    this.isDarwinStub = sinon.stub(platformUtil, 'isDarwin', () => isDarwin)
    fakeElectron.reset()
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('leveldown', {})
    mockery.registerMock('keytar', {})
    sessionStore = require('../../../app/sessionStore')
    sessionStoreShutdown = require('../../../app/sessionStoreShutdown')
    appActions = require('../../../js/actions/appActions')
    appStore = require('../../../js/stores/appStore')
  })

  after(function () {
    this.clock.restore()
    this.isWindowsStub.restore()
    this.isDarwinStub.restore()
    mockery.disable()
  })

  afterEach(function () {
    sessionStoreShutdown.reset()
  })

  describe('windows all closed', function () {
    before(function () {
      this.appQuitSpy = sinon.spy(fakeElectron.app, 'quit')
      sessionStoreShutdown.reset()
    })
    afterEach(function () {
      this.appQuitSpy.reset()
    })
    after(function () {
      this.appQuitSpy.restore()
    })
    it('does not quit on macOS', function () {
      isDarwin = true
      fakeElectron.app.emit('window-all-closed')
      assert.equal(this.appQuitSpy.notCalled, true)
      isDarwin = false
    })
    it('quits on Windows', function () {
      isWindows = true
      fakeElectron.app.emit('window-all-closed')
      assert.equal(this.appQuitSpy.calledOnce, true)
      isWindows = false
    })
    it('quits on linux', function () {
      fakeElectron.app.emit('window-all-closed')
      assert.equal(this.appQuitSpy.calledOnce, true)
    })
  })

  describe('undo close window', function () {
    before(function () {
      this.newWindowStub = sinon.stub(appActions, 'newWindow')
      sessionStoreShutdown.reset()
    })
    afterEach(function () {
      this.newWindowStub.reset()
    })
    after(function () {
      this.newWindowStub.restore()
    })

    it('works for first closed window', function () {
      const windowState = { a: 1 }
      fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState)
      process.emit(messages.UNDO_CLOSED_WINDOW)
      assert(this.newWindowStub.calledOnce)
      assert.deepEqual(this.newWindowStub.getCall(0).args[2], windowState)
    })
    it('works for subsequent windows', function () {
      const windowState1 = { b: 1 }
      const windowState2 = { x: 2 }
      fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState1)
      fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState2)
      process.emit(messages.UNDO_CLOSED_WINDOW)
      assert(this.newWindowStub.calledOnce)
      assert.deepEqual(this.newWindowStub.getCall(0).args[2], windowState2)
    })
  })

  describe('app before-quit event', function () {
    before(function () {
      this.appStoreGetStateStub = sinon.stub(appStore, 'getState', () => {
        return Immutable.fromJS({})
      })
      this.shuttingDownStub = sinon.stub(appActions, 'shuttingDown')
      this.appQuitSpy = sinon.spy(fakeElectron.app, 'quit')
      sessionStoreShutdown.reset()
    })
    afterEach(function () {
      this.shuttingDownStub.reset()
      this.appStoreGetStateStub.reset()
      this.appQuitSpy.reset()
    })
    after(function () {
      this.shuttingDownStub.restore()
      this.appStoreGetStateStub.restore()
      this.appQuitSpy.restore()
    })

    describe('with no windows', function () {
      before(function () {
        this.requestId = 1
        this.getAllWindowsStub = sinon.stub(fakeElectron.BrowserWindow, 'getAllWindows', () => {
          return []
        })
      })
      after(function () {
        this.getAllWindowsStub.restore()
      })
      it('saves when no windows', function (cb) {
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 0)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
      it('remembers last closed window with no windows (Win32)', function (cb) {
        isWindows = true
        const windowState = { a: 1 }
        fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState)
        fakeElectron.app.emit('window-all-closed')
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          isWindows = false
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 1)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
      it('remembers last closed window with no windows (Linux)', function (cb) {
        const windowState = { a: 1 }
        fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState)
        fakeElectron.app.emit('window-all-closed')
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 1)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
      it('remembers last closed window with no windows (macOS)', function (cb) {
        isDarwin = true
        const windowState = { a: 1 }
        fakeElectron.ipcMain.send(messages.LAST_WINDOW_STATE, {}, windowState)
        fakeElectron.app.emit('window-all-closed')
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          isDarwin = false
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 0)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
    })

    describe('with one window', function () {
      before(function () {
        this.fakeWindow1 = new FakeWindow(1)
        this.requestId = 1
        this.getAllWindowsStub = sinon.stub(fakeElectron.BrowserWindow, 'getAllWindows', () => {
          return [this.fakeWindow1]
        })
      })
      beforeEach(function () {
        this.fakeWindow1.webContents.removeAllListeners(messages.REQUEST_WINDOW_STATE)
      })
      after(function () {
        this.getAllWindowsStub.restore()
      })
      it('saves when all windows responds without the clock moving forward', function (cb) {
        this.fakeWindow1.webContents.on(messages.REQUEST_WINDOW_STATE, () => {
          setImmediate(() => {
            fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), this.fakeWindow1, this.requestId)
          })
        })
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 1)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
      it('times out and saves app state anyway', function (cb) {
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.deepEqual(state.perWindowState, [{a: 1}])
          cb()
          return Promise.resolve()
        })

        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), {a: 1}, 0)
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(100000)
      })
    })
    describe('with multiple windows', function () {
      before(function () {
        this.fakeWindow1 = new FakeWindow(1)
        this.fakeWindow2 = new FakeWindow(2)
        this.fakeWindow3 = new FakeWindow(3)
        this.requestId = 1
        this.getAllWindowsStub = sinon.stub(fakeElectron.BrowserWindow, 'getAllWindows', () => {
          return [this.fakeWindow1, this.fakeWindow2, this.fakeWindow3]
        })
      })
      beforeEach(function () {
        this.fakeWindow1.webContents.removeAllListeners(messages.REQUEST_WINDOW_STATE)
        this.fakeWindow2.webContents.removeAllListeners(messages.REQUEST_WINDOW_STATE)
        this.fakeWindow3.webContents.removeAllListeners(messages.REQUEST_WINDOW_STATE)
      })
      after(function () {
        this.getAllWindowsStub.restore()
      })
      it('saves when all windows responds without the clock moving forward', function (cb) {
        this.fakeWindow1.webContents.on(messages.REQUEST_WINDOW_STATE, () => {
          setImmediate(() => {
            fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), this.fakeWindow1, this.requestId)
          })
        })
        this.fakeWindow2.webContents.on(messages.REQUEST_WINDOW_STATE, () => {
          setImmediate(() => {
            fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow2), this.fakeWindow2, this.requestId)
          })
        })
        this.fakeWindow3.webContents.on(messages.REQUEST_WINDOW_STATE, () => {
          setImmediate(() => {
            fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow3), this.fakeWindow3, this.requestId)
          })
        })
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.equal(state.perWindowState.length, 3)
          cb()
          return Promise.resolve()
        })
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1)
      })
      it('times out and saves app state anyway', function (cb) {
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.calledOnce, true)
          saveAppStateStub.restore()
          assert.deepEqual(state.perWindowState, [{a: 1}, {b: 2}, {c: 3}])
          cb()
          return Promise.resolve()
        })
        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), {a: 1}, 0)
        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow2), {b: 2}, 0)
        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow3), {c: 3}, 0)
        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(100000)
      })
      it('saves when only one of multiple windows respond and timeout happens', function (cb) {
        const saveAppStateStub = sinon.stub(sessionStore, 'saveAppState', (state) => {
          assert.equal(saveAppStateStub.called, true)
          saveAppStateStub.restore()
          assert.deepEqual(state.perWindowState, [{a: 5}, {b: 2}])
          cb()
          return Promise.resolve()
        })

        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), {a: 1}, 0)
        fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow2), {b: 2}, 0)
        const requestId = 1

        this.fakeWindow1.webContents.on(messages.REQUEST_WINDOW_STATE, () => {
          setImmediate(() => {
            fakeElectron.ipcMain.send(messages.RESPONSE_WINDOW_STATE, makeSender(this.fakeWindow1), {a: 5}, requestId)
          })
        })

        fakeElectron.app.emit('before-quit', { preventDefault: () => {} })
        assert.equal(saveAppStateStub.notCalled, true)
        this.clock.tick(1000000)
      })
    })
  })
})
