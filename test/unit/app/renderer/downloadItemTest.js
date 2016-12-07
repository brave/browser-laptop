/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../lib/fakeElectron')
const path = require('path')
const uuid = require('uuid')
const Immutable = require('immutable')
const downloadStates = require('../../../../js/constants/downloadStates')
const {CANCEL, PAUSE, RESUME} = require('../../../../app/common/constants/electronDownloadItemActions')
let DownloadItem, appActions
require('../../braveUnit')

const savePath = path.join(require('os').tmpdir(), 'mostHatedPrimes.txt')
const downloadUrl = 'http://www.bradrichter.com/mostHatedPrimes.txt'
const newDownload = (state) => Immutable.fromJS({
  startTime: new Date().getTime(),
  filename: 'mostHatedPrimes.txt',
  savePath,
  url: downloadUrl,
  totalBytes: 104729,
  receivedBytes: 96931,
  state
})

describe('downloadItem component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    DownloadItem = require('../../../../app/renderer/components/downloadItem')
    appActions = require('../../../../js/actions/appActions')
  })
  after(function () {
    mockery.disable()
  })

  Object.values(downloadStates).forEach(function (state) {
    describe(`${state} download item`, function () {
      before(function () {
        this.downloadId = uuid.v4()
        this.download = newDownload(state)
        this.result = mount(<DownloadItem downloadId={this.downloadId} download={newDownload(state)} />)
      })

      const shouldProgressBarExist = [downloadStates.IN_PROGRESS, downloadStates.PAUSED].includes(state)
      it('filename exists and matches download filename', function () {
        assert.equal(this.result.find('.downloadFilename').text(), this.download.get('filename'))
      })
      it(shouldProgressBarExist ? 'progress bar should exist' : 'progress bar should not exist', function () {
        assert.equal(this.result.find('.downloadProgress').length, shouldProgressBarExist ? 1 : 0)
      })

      const testButton = function (buttonSelector, allowedStates, allowedFn) {
        const exists = allowedStates.includes(state)
        it(exists ? `${buttonSelector} button in state ${state} performs the correct action` : `${buttonSelector} is not shown`, function () {
          const button = this.result.find(buttonSelector)
          if (exists) {
            allowedFn.call(this, button)
          } else {
            assert.equal(button.length, 0)
          }
        })
      }

      testButton('.pauseButton', [downloadStates.IN_PROGRESS], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId, PAUSE).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('.resumeButton', [downloadStates.PAUSED], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId, RESUME).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('.cancelButton', [downloadStates.IN_PROGRESS, downloadStates.PAUSED], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId, CANCEL).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('.redownloadButton', [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'downloadRedownloaded')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId).calledOnce)
        appActions.downloadRedownloaded.restore()
      })

      testButton('.copyLinkButton', Object.values(downloadStates), function (button) {
        const spy = sinon.spy(appActions, 'downloadCopiedToClipboard')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId).calledOnce)
        appActions.downloadCopiedToClipboard.restore()
      })

      testButton('.revealButton', [downloadStates.IN_PROGRESS, downloadStates.PAUSED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'downloadRevealed')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId).calledOnce)
        appActions.downloadRevealed.restore()
      })

      testButton('.deleteButton', [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'downloadDeleted')
        button.simulate('click')
        assert(spy.withArgs(this.downloadId).calledOnce)
        appActions.downloadDeleted.restore()
      })
    })
  })
})
