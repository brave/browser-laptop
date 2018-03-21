/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../../lib/fakeElectron')
const path = require('path')
const uuid = require('uuid')
const Immutable = require('immutable')
const downloadStates = require('../../../../../../js/constants/downloadStates')
const {CANCEL, PAUSE, RESUME} = require('../../../../../../app/common/constants/electronDownloadItemActions')
require('../../../../braveUnit')

const savePath = path.join(require('os').tmpdir(), 'mostHatedPrimes.txt')
const downloadUrl = 'http://www.bradrichter.com/mostHatedPrimes.txt'
const localFileDownloadUrl = 'file:///Users/foobar/Library/abc.txt'
const appStateDownload = (state, downloadId, confirmation = false) => Immutable.fromJS({
  downloads: {
    [downloadId]: {
      startTime: new Date().getTime(),
      filename: 'mostHatedPrimes.txt',
      savePath,
      url: downloadUrl,
      totalBytes: 104729,
      receivedBytes: 96931,
      state
    }
  },
  deleteConfirmationVisible: confirmation
})

const appStateDownloadLocalFile = (state, downloadId) => Immutable.fromJS({
  downloads: {
    [downloadId]: {
      startTime: new Date().getTime(),
      filename: 'abc.txt',
      savePath,
      url: localFileDownloadUrl,
      totalBytes: 104729,
      receivedBytes: 96931,
      state
    }
  },
  deleteConfirmationVisible: false
})

describe('downloadItem component', function () {
  let DownloadItem, appActions, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/l10n', {
      translation: () => 'wow such title very translated'
    })
    DownloadItem = require('../../../../../../app/renderer/components/download/downloadItem')
    appActions = require('../../../../../../js/actions/appActions')
    appStore = require('../../../../../../js/stores/appStoreRenderer')
  })

  after(function () {
    mockery.disable()
  })

  Object.values(downloadStates).forEach(function (state) {
    let result, downloadId

    const testButton = function (buttonSelector, allowedStates, allowedFn) {
      const exists = allowedStates.includes(state)
      it(exists ? `${buttonSelector} button in state ${state} performs the correct action` : `${buttonSelector} is not shown`, function () {
        const button = result.find(buttonSelector)
        if (exists) {
          allowedFn.call(this, button)
        } else {
          assert.equal(button.length, 0)
        }
      })
    }

    describe(`${state} download local item`, function () {
      before(function () {
        downloadId = uuid.v4()
        appStore.state = appStateDownloadLocalFile(state, downloadId)
        result = mount(<DownloadItem downloadId={downloadId} />)
      })

      it('filename exists and matches download filename', function () {
        assert.equal(result.find('.downloadFilename').text(), appStore.state.getIn(['downloads', downloadId, 'filename']))
      })

      it('has local origin i.e file: and matches to "Local file" origin', function () {
        assert.equal(result.find('.downloadOrigin').text(), '')
      })
    })

    describe(`${state} download item`, function () {
      before(function () {
        downloadId = uuid.v4()
        appStore.state = appStateDownload(state, downloadId)
        result = mount(<DownloadItem downloadId={downloadId} />)
      })

      it('filename exists and matches download filename', function () {
        assert.equal(result.find('[data-test-id="downloadFilename"]').text(), appStore.state.getIn(['downloads', downloadId, 'filename']))
      })

      it('origin exists and matches download origin', function () {
        assert.equal(result.find('[data-test-id="downloadOrigin"]').text(), 'http://www.bradrichter.com')
      })

      const shouldProgressBarExist = [downloadStates.IN_PROGRESS, downloadStates.PAUSED].includes(state)
      it(shouldProgressBarExist ? 'progress bar should exist' : 'progress bar should not exist', function () {
        assert.equal(result.find('[data-test-id="downloadProgress"]').length, shouldProgressBarExist ? 1 : 0)
      })

      testButton('[data-test-id="pauseButton"]', [downloadStates.IN_PROGRESS], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(downloadId, PAUSE).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('[data-test-id="resumeButton"]', [downloadStates.PAUSED], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(downloadId, RESUME).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('[data-test-id="cancelButton"]', [downloadStates.IN_PROGRESS, downloadStates.PAUSED], function (button) {
        const spy = sinon.spy(appActions, 'downloadActionPerformed')
        button.simulate('click')
        assert(spy.withArgs(downloadId, CANCEL).calledOnce)
        appActions.downloadActionPerformed.restore()
      })

      testButton('[data-test-id="redownloadButton"]', [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.UNAUTHORIZED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'downloadRedownloaded')
        button.simulate('click')
        assert(spy.withArgs(downloadId).calledOnce)
        appActions.downloadRedownloaded.restore()
      })

      testButton('[data-test-id="copyLinkButton"]', [downloadStates.PENDING, downloadStates.IN_PROGRESS, downloadStates.RESUMING, downloadStates.PAUSED, downloadStates.COMPLETED, downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.UNAUTHORIZED], function (button) {
        const spy = sinon.spy(appActions, 'downloadCopiedToClipboard')
        button.simulate('click')
        assert(spy.withArgs(downloadId).calledOnce)
        appActions.downloadCopiedToClipboard.restore()
      })

      testButton('[data-test-id="revealButton"]', [downloadStates.IN_PROGRESS, downloadStates.PAUSED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'downloadRevealed')
        button.simulate('click')
        assert(spy.withArgs(downloadId).calledOnce)
        appActions.downloadRevealed.restore()
      })

      testButton('[data-test-id="deleteButton"]', [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.COMPLETED], function (button) {
        const spy = sinon.spy(appActions, 'showDownloadDeleteConfirmation')
        try {
          // Confirmation should NOT be visible by default
          assert.equal(result.find('[data-test-id="confirmDeleteButton"]').length, 0)

          // Clicking delete should show confirmation
          button.simulate('click')
          assert(spy.called)
        } finally {
          appActions.showDownloadDeleteConfirmation.restore()
        }
      })
    })

    if ([downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.UNAUTHORIZED, downloadStates.COMPLETED].includes(state)) {
      describe(`${state} download item when delete button has been clicked`, function () {
        before(function () {
          downloadId = uuid.v4()
          appStore.state = appStateDownload(state, downloadId, true)
          result = mount(<DownloadItem downloadId={downloadId} />)
        })

        testButton('[data-test-id="confirmDeleteButton"]', [downloadStates.CANCELLED, downloadStates.INTERRUPTED, downloadStates.UNAUTHORIZED, downloadStates.COMPLETED], function (button) {
          const spy = sinon.spy(appActions, 'downloadDeleted')
          try {
            // Accepting confirmation should delete the item
            button.simulate('click')
            assert(spy.withArgs(downloadId).calledOnce)
          } finally {
            appActions.downloadDeleted.restore()
          }
        })
      })
    }
  })
})
