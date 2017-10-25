/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before, after */

const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const Brave = require('../lib/brave')
const {
  urlInput,
  downloadBar,
  downloadItem,
  downloadPause,
  downloadResume,
  downloadCancel,
  downloadComplete,
  downloadReDownload,
  downloadRemoveFromList,
  downloadDelete,
  downloadDeleteConfirm
} = require('../lib/selectors')
const settingsConst = require('../../js/constants/settings')

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

describe('Downloads', function () {
  describe('Location and file naming tests', function () {
    let tempDownloadPath, downloadFile, downloadSite, renamedFile
    Brave.beforeAll(this)
    before(function * () {
      tempDownloadPath = path.join(os.tmpdir(), 'brave-test', 'downloads')
      downloadFile = 'Brave_proudly-partner_badges.zip'
      downloadSite = `https://brave.com/about/${downloadFile}`
      renamedFile = downloadFile.slice(0, downloadFile.indexOf('.')) + ' (1)' + downloadFile.slice(downloadFile.indexOf('.'))

      yield setup(this.app.client)

      yield this.app.client
        .changeSetting(settingsConst.DOWNLOAD_ALWAYS_ASK, false)
        .changeSetting(settingsConst.DOWNLOAD_DEFAULT_PATH, tempDownloadPath)
        .waitForUrl(Brave.newTabUrl)
    })

    after(function * () {
      yield new Promise((resolve, reject) => {
        return fs.remove(tempDownloadPath, (err) => err ? reject(err) : resolve())
      })
    })

    it('check if first download completes', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .url(downloadSite)
        .waitForElementCount(downloadComplete, 1)

      yield new Promise((resolve, reject) => {
        return fs.access(path.join(tempDownloadPath, downloadFile), fs.constants.F_OK, (err) => {
          return err ? reject(err) : resolve(true)
        })
      }).should.eventually.be.true
    })

    it('check if second download completes and is renamed', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .url(downloadSite)
        .waitForElementCount(downloadComplete, 2)

      yield new Promise((resolve, reject) => {
        return fs.access(path.join(tempDownloadPath, renamedFile), fs.constants.F_OK, (err) => {
          return err ? reject(err) : resolve(true)
        })
      }).should.eventually.be.true
    })
  })

  describe('Item and bar tests', function () {
    Brave.beforeAll(this)
    before(function * () {
      this.downloadSite = 'http://releases.ubuntu.com/16.04.2/ubuntu-16.04.2-desktop-amd64.iso'
      yield setup(this.app.client)

      yield this.app.client
        .changeSetting(settingsConst.DOWNLOAD_ALWAYS_ASK, false)
        .waitForSettingValue(settingsConst.DOWNLOAD_ALWAYS_ASK, false)
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
})
