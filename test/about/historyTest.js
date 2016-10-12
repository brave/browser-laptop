/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutHistoryUrl = getTargetAboutUrl('about:history')

describe('about:history', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield this.app.client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .addSite({ location: 'https://brave.com', title: 'Brave' })
      .addSite({ location: 'https://brave.com/test', customTitle: 'customTest' })
      .addSite({ location: 'https://www.youtube.com' })
      .addSite({ location: 'https://www.facebook.com' })
      .waitForExist('.tab[data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutHistoryUrl)
  })

  it('displays entries with title as: title or URL', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
  })

  it('does NOT use customTitle when displaying entries', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable td.title[data-sort="customTest"]', 1000, true)
  })

  // shows ordered by date

  it('defaults to sorting table by time DESC', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable thead tr th.sort-up[data-l10n-id="time"]')
  })

  // search box

  // Multi Select
  it('Simulate cmd/control click behavior', function * () {
    yield this.app.client
      .tabByUrl(aboutHistoryUrl)
      .click('table.sortableTable td.title[data-sort="Brave"]')
      .isDarwin().then((val) => {
        if (val === true) {
          return this.app.client.keys(Brave.keys.COMMAND)
        } else {
          return this.app.client.keys(Brave.keys.CONTROL)
        }
      })
      .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://brave.com/test"]')
      // key depressed
      .isDarwin().then((val) => {
        if (val === true) {
          return this.app.client.keys(Brave.keys.COMMAND)
        } else {
          return this.app.client.keys(Brave.keys.CONTROL)
        }
      })
      .click('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.facebook.com"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://brave.com/test"]')
      .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
      // reset state
      .click('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
  })
  it('Simulate shift click behavior', function * () {
    yield this.app.client
      .tabByUrl(aboutHistoryUrl)
      .click('table.sortableTable td.title[data-sort="Brave"]')
      .keys(Brave.keys.SHIFT)
      .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://brave.com/test"]')
      .waitForVisible('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
      // key depressed
      .keys(Brave.keys.SHIFT)
      .click('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.facebook.com"]')
      .isDarwin().then((val) => {
        if (val === true) {
          return this.app.client.keys(Brave.keys.COMMAND)
        } else {
          return this.app.client.keys(Brave.keys.CONTROL)
        }
      })
      .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
      // key depressed
      .isDarwin().then((val) => {
        if (val === true) {
          return this.app.client.keys(Brave.keys.COMMAND)
        } else {
          return this.app.client.keys(Brave.keys.CONTROL)
        }
      })
      .keys(Brave.keys.SHIFT)
      .click('table.sortableTable td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://brave.com/test"]')
      .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.facebook.com"]')
      // reset state
      // key depressed
      .keys(Brave.keys.SHIFT)
      .click('table.sortableTable td.title[data-sort="Brave"]')
  })
})
