/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const process = require('process')
const assert = require('assert')
const uuid = require('uuid')
const path = require('path')
const appActions = require('../../../../../js/actions/appActions')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
const {PENDING, IN_PROGRESS, RESUMING, PAUSED, COMPLETED, CANCELLED, INTERRUPTED} = require('../../../../../js/constants/downloadStates')
const settings = require('../../../../../js/constants/settings')
const {CANCEL} = require('../../../../../app/common/constants/electronDownloadItemActions')
require('../../../braveUnit')

const downloadId = (state, i = 0) => Object.keys(state.get('downloads').toJS())[i]
const downloadUrl = 'http://www.bradrichter.com/mostHatedPrimes.txt'
const savePath = path.join(require('os').tmpdir(), 'mostHatedPrimes.txt')
const oneDownloadWithState = (state) => Immutable.fromJS({
  downloads: {
    [uuid.v4()]: {
      startTime: new Date().getTime(),
      filename: 'mostHatedPrimes.txt',
      savePath,
      url: downloadUrl,
      totalBytes: 104729,
      receivedBytes: 96931,
      state
    }
  }
})

describe('downloadsReducer', function () {
  let downloadsReducer
  let fakeSettings
  let downloadDefaultPath
  let changeSettingSpy
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    fakeSettings = {
      getSetting: (settingKey, settingsCollection) => {
        switch (settingKey) {
          case settings.DOWNLOAD_DEFAULT_PATH:
            return downloadDefaultPath
        }
      }
    }

    changeSettingSpy = sinon.spy(appActions, 'changeSetting')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/settings', fakeSettings)
    mockery.registerMock('../../../js/actions/appActions', appActions)
    downloadsReducer = require('../../../../../app/browser/reducers/downloadsReducer')
  })

  after(function () {
    changeSettingSpy.restore()
    mockery.disable()
  })

  it('returns original state for unhandled actions', function () {
    const oldState = oneDownloadWithState(IN_PROGRESS)
    const newState = downloadsReducer(oldState, {actionType: uuid.v4()})
    assert.deepEqual(newState.toJS(), oldState.toJS())
  })

  describe('APP_DOWNLOAD_REVEALED', function () {
    it('Reveals file for paths that does not exist exist', function (cb) {
      sinon.stub(fakeElectron.shell, 'showItemInFolder', (path) => {
        fakeElectron.shell.showItemInFolder.restore()
        assert.equal(path, process.cwd())
        cb()
      })
      let oldState = oneDownloadWithState(IN_PROGRESS)
      oldState = oldState.setIn(['downloads', downloadId(oldState), 'savePath'], process.cwd())
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_REVEALED, downloadId: downloadId(oldState)})
    })
    it('Reveals file for paths that does not exist exist', function (cb) {
      const saveDir = path.dirname(savePath)
      sinon.stub(fakeElectron.shell, 'openItem', (path) => {
        fakeElectron.shell.openItem.restore()
        assert.equal(path, saveDir)
        cb()
      })
      const oldState = oneDownloadWithState(IN_PROGRESS)
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_REVEALED, downloadId: downloadId(oldState)})
    })
  })

  describe('APP_DOWNLOAD_OPENED', function () {
    it('Opens a downloaded file', function (cb) {
      sinon.stub(fakeElectron.shell, 'openItem', (path) => {
        fakeElectron.shell.openItem.restore()
        assert.equal(path, process.cwd())
        cb()
      })
      let oldState = oneDownloadWithState(IN_PROGRESS)
      oldState = oldState.setIn(['downloads', downloadId(oldState), 'savePath'], process.cwd())
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_OPENED, downloadId: downloadId(oldState)})
    })
    it('Beeps when a downloaded file is trying to be opened', function (cb) {
      sinon.stub(fakeElectron.shell, 'beep', () => {
        fakeElectron.shell.beep.restore()
        cb()
      })
      const oldState = oneDownloadWithState(IN_PROGRESS)
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_OPENED, downloadId: downloadId(oldState)})
    })
  })

  describe('APP_DOWNLOAD_ACTION_PERFORMED', function () {
    it('CANCEL causes CANCELLED state', function () {
      const oldState = oneDownloadWithState(IN_PROGRESS)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_ACTION_PERFORMED, downloadId: downloadId(oldState), downloadAction: CANCEL})
      assert.equal(newState.getIn(['downloads', downloadId(oldState), 'state']), CANCELLED)
    })
  })

  describe('APP_DOWNLOAD_COPIED_TO_CLIPBOARD', function () {
    it('copies the download URL to the clipboard', function () {
      const spy = sinon.spy(fakeElectron.clipboard, 'writeText')
      const oldState = oneDownloadWithState(IN_PROGRESS)
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_COPIED_TO_CLIPBOARD, downloadId: downloadId(oldState)})
      assert(spy.withArgs(downloadUrl).calledOnce)
      fakeElectron.clipboard.writeText.restore()
    })
  })

  describe('APP_DOWNLOAD_DELETED', function () {
    it('deletes a downloadId that exists', function (cb) {
      let oldState = oneDownloadWithState(IN_PROGRESS)
      const existingPath = process.cwd()
      oldState = oldState.setIn(['downloads', downloadId(oldState), 'savePath'], existingPath)
      sinon.stub(fakeElectron.shell, 'moveItemToTrash', (path) => {
        assert.equal(path, existingPath)
        fakeElectron.shell.moveItemToTrash.restore()
        cb()
      })
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_DELETED, downloadId: downloadId(oldState)})
      assert.equal(Object.keys(newState.get('downloads').toJS()).length, 0)
    })
    it('does nothing for a downloadId that does not exist', function () {
      const oldState = oneDownloadWithState(IN_PROGRESS)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_DELETED, downloadId: uuid.v4()})
      assert.deepEqual(newState.toJS(), oldState.toJS())
    })
  })

  describe('APP_DOWNLOAD_CLEARED', function () {
    it('clears download item', function () {
      const oldState = oneDownloadWithState(IN_PROGRESS)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_DELETED, downloadId: downloadId(oldState)})
      assert.equal(Object.keys(newState.get('downloads').toJS()).length, 0)
    })
    it('does nothing for a downloadId that does not exist', function () {
      const oldState = oneDownloadWithState(IN_PROGRESS)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_DELETED, downloadId: uuid.v4()})
      assert.deepEqual(newState.toJS(), oldState.toJS())
    })
  })

  describe('APP_DOWNLOAD_REDOWNLOADED', function () {
    const win = {
      webContents: {
        downloadURL: function () {
        }
      }
    }
    let spy
    before(() => {
      spy = sinon.stub(fakeElectron.BrowserWindow, 'getFocusedWindow', (path) => {
        return win
      })
    })
    after(() => {
      spy.restore()
    })
    it('should redownload the same URL', function (cb) {
      sinon.stub(win.webContents, 'downloadURL', (redownloadUrl) => {
        assert.equal(redownloadUrl, downloadUrl)
        cb()
      })
      const oldState = oneDownloadWithState(CANCELLED)
      downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_REDOWNLOADED, downloadId: downloadId(oldState)})
    })
  })

  describe('APP_MERGE_DOWNLOAD_DETAIL', function () {
    it('should update downloads', function () {
      const oldState = oneDownloadWithState(PENDING)
      const newState = downloadsReducer(oldState,
        {
          actionType: appConstants.APP_MERGE_DOWNLOAD_DETAIL,
          downloadId: downloadId(oldState),
          downloadDetail: {state: COMPLETED}
        }
      )
      assert.equal(newState.getIn(['downloads', downloadId(oldState), 'state']), COMPLETED)
    })
    it('should not update for invalid download Ids', function () {
      const oldState = oneDownloadWithState(PENDING)
      const newState = downloadsReducer(oldState,
        {
          actionType: appConstants.APP_MERGE_DOWNLOAD_DETAIL,
          downloadId: uuid.v4(),
          downloadDetail: {state: COMPLETED}
        }
      )
      assert.equal(newState.getIn(['downloads', downloadId(oldState), 'state']), PENDING)
    })
    it('should add new download IDs as needed', function () {
      const oldState = oneDownloadWithState(PENDING)
      const downloadId = uuid.v4()
      const newState = downloadsReducer(oldState,
        {
          actionType: appConstants.APP_MERGE_DOWNLOAD_DETAIL,
          downloadId,
          downloadDetail: {state: COMPLETED}
        }
      )
      assert.equal(newState.getIn(['downloads', downloadId, 'state']), COMPLETED)
      assert.equal(Object.keys(newState.get('downloads').toJS()).length, 2)
    })
  })

  describe('APP_CLEAR_COMPLETED_DOWNLOADS', function () {
    it('should clear completed downloads', function () {
      const states = [COMPLETED, CANCELLED, INTERRUPTED]
      states.forEach((state) => {
        const newState = downloadsReducer(oneDownloadWithState(state), {actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
        assert.equal(Object.keys(newState.get('downloads').toJS()).length, 0)
      })
    })
    it('should not clear downloads when they are still in progress', function () {
      const states = [PENDING, IN_PROGRESS, RESUMING, PAUSED]
      states.forEach((state) => {
        const newState = downloadsReducer(oneDownloadWithState(state), {actionType: appConstants.APP_CLEAR_COMPLETED_DOWNLOADS})
        assert.equal(Object.keys(newState.get('downloads').toJS()).length, 1)
      })
    })
  })

  describe('APP_SELECT_DEFAULT_DOWNLOAD_PATH', function () {
    describe('when showing folder selection dialog', function () {
      let stub
      let options

      before(function () {
        stub = sinon.stub(fakeElectron.dialog, 'showDialog', function (arg1, arg2) {
          options = arg2
        })
        downloadsReducer({}, {actionType: appConstants.APP_SELECT_DEFAULT_DOWNLOAD_PATH})
      })

      after(function () {
        stub.restore()
      })

      it('calls dialog.showDialog', function () {
        assert(stub.calledOnce)
      })

      it('passes the correct defaultPath', function () {
        assert.equal(options.defaultPath, `${process.cwd()}/downloads`)
      })

      it('passes the correct properties object', function () {
        assert.deepEqual(options.type, 'select-folder')
      })
    })
  })

  describe('APP_SET_STATE', function () {
    it('set DOWNLOAD_DEFAULT_PATH when empty', function () {
      changeSettingSpy.reset()
      downloadDefaultPath = ''
      downloadsReducer({}, {actionType: appConstants.APP_SET_STATE})
      assert(changeSettingSpy.withArgs(settings.DOWNLOAD_DEFAULT_PATH, `${process.cwd()}/downloads`).calledOnce)
    })
    it('does not set DOWNLOAD_DEFAULT_PATH when not empty', function () {
      changeSettingSpy.reset()
      downloadDefaultPath = '123'
      downloadsReducer({}, {actionType: appConstants.APP_SET_STATE})
      assert(changeSettingSpy.notCalled)
    })
  })
})
