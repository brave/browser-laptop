/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const process = require('process')
const assert = require('assert')
const uuid = require('uuid')
const path = require('path')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
const {PENDING, IN_PROGRESS, RESUMING, PAUSED, COMPLETED, CANCELLED, INTERRUPTED} = require('../../../../../js/constants/downloadStates')
const {CANCEL, PAUSE, RESUME} = require('../../../../../app/common/constants/electronDownloadItemActions')
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
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    downloadsReducer = require('../../../../../app/browser/reducers/downloadsReducer')
  })

  after(function () {
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
    it('PAUSE causes PAUSED state', function () {
      const oldState = oneDownloadWithState(IN_PROGRESS)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_ACTION_PERFORMED, downloadId: downloadId(oldState), downloadAction: PAUSE})
      assert.equal(newState.getIn(['downloads', downloadId(oldState), 'state']), PAUSED)
    })
    it('RESUME causes an IN_PROGRESS state', function () {
      const oldState = oneDownloadWithState(PAUSED)
      const newState = downloadsReducer(oldState, {actionType: appConstants.APP_DOWNLOAD_ACTION_PERFORMED, downloadId: downloadId(oldState), downloadAction: RESUME})
      assert.equal(newState.getIn(['downloads', downloadId(oldState), 'state']), IN_PROGRESS)
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
    it('should redownload the same URL', function (cb) {
      const win = {
        webContents: {
          downloadURL: function () {
          }
        }
      }
      sinon.stub(win.webContents, 'downloadURL', (redownloadUrl) => {
        assert.equal(redownloadUrl, downloadUrl)
        cb()
      })
      sinon.stub(fakeElectron.BrowserWindow, 'getFocusedWindow', (path) => {
        return win
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
})
