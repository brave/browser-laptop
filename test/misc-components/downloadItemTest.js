/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before */

const Brave = require('../lib/brave')
const {
  urlInput,
  downloadBar,
  downloadItem,
  downloadPause,
  downloadResume,
  downloadCancel,
  downloadReDownload,
  downloadRemoveFromList,
  downloadDelete,
  downloadDeleteConfirm
} = require('../lib/selectors')

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

describe('downloadItem test', function () {
  Brave.beforeAll(this)
  before(function * () {
    this.downloadSite = 'http://releases.ubuntu.com/16.04.2/ubuntu-16.04.2-desktop-amd64.iso'
    yield setup(this.app.client)

    yield this.app.client
      .changeSetting('general.download-always-ask', false)
      .waitForSettingValue('general.download-always-ask', false)
      .waitForUrl(Brave.newTabUrl)
      .url(this.downloadSite)
  })

  it('check if download bar is shown', function * () {
    yield this.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitForElementCount(downloadBar, 1)
  })

  it('check if you can pause download', function * () {
    yield this.app.client
      .moveToObject(downloadItem)
      .waitForElementCount(downloadPause, 1)
      .click(downloadPause)
      .waitForElementCount(downloadResume, 1)
  })

  it('check if you can resume download', function * () {
    yield this.app.client
      .waitForElementCount(downloadResume, 1)
      .click(downloadResume)
      .waitForElementCount(downloadPause, 1)
  })

  it('check if you can cancel download', function * () {
    yield this.app.client
      .waitForElementCount(downloadPause, 1)
      .click(downloadCancel)
      .waitForElementCount(downloadReDownload, 1)
  })

  it('check if you can re-download', function * () {
    yield this.app.client
      .waitForElementCount(downloadReDownload, 1)
      .click(downloadReDownload)
      .waitForElementCount(downloadPause, 1)
  })

  it('check if you can remove item from the list', function * () {
    yield this.app.client
      .moveToObject(downloadItem)
      .waitForElementCount(downloadPause, 1)
      .click(downloadCancel)
      .waitForElementCount(downloadReDownload, 1)
      .click(downloadRemoveFromList)
      .waitForElementCount(downloadBar, 0)
  })

  it('check if you can delete downloaded item', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.downloadSite)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForElementCount(downloadBar, 1)
      .moveToObject(downloadItem)
      .waitForElementCount(downloadPause, 1)
      .click(downloadCancel)
      .waitForElementCount(downloadReDownload, 1)
      .click(downloadDelete)
      .waitForElementCount(downloadDeleteConfirm, 1)
      .click(downloadDeleteConfirm)
      .waitForElementCount(downloadBar, 0)
  })
})
