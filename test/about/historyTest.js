/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutHistoryUrl = getTargetAboutUrl('about:history')
const Immutable = require('immutable')

describe('about:history', function () {
  const browseableSiteUrl = 'page1.html'
  const browseableSiteTitle = 'Page 1'

  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  function * addDemoSites (client) {
    const sites = Immutable.fromJS([
      { location: 'https://brave.com', title: 'Brave' },
      { location: 'https://brave.com/test', customTitle: 'customTest' },
      { location: 'https://www.youtube.com' },
      { location: 'https://www.facebook.com' }
    ])

    yield client
      .waitForBrowserWindow()
      .addSiteList(sites)
      .tabByIndex(0)
      .loadUrl(aboutHistoryUrl)
  }

  function * addBrowseableSite (client) {
    const location = Brave.server.url(browseableSiteUrl)
    const sites = Immutable.fromJS([{
      location,
      title: browseableSiteTitle
    }])
    yield client
      .waitForBrowserWindow()
      .addSiteList(sites)
      .tabByIndex(0)
      .loadUrl(aboutHistoryUrl)
  }

  describe('page content', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSites(this.app.client)
    })

    it('does not display Brave default sites', function * () {
      yield this.app.client
        .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
        .waitForElementCount('td.time', 4)
    })
    it('displays entries with title as: title or URL', function * () {
      yield this.app.client
        .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
    })

    it('does NOT use customTitle when displaying entries', function * () {
      yield this.app.client
        .waitForElementCount('table.sortableTable td.title[data-sort="customTest"]', 0)
    })

    it('defaults to sorting table by time DESC', function * () {
      yield this.app.client
        .waitForVisible('table.sortableTable .sort-default[data-sort-order="desc"] div[data-l10n-id="time"]')
    })
  })

  describe('double click behavior', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addBrowseableSite(this.app.client)
    })

    it('opens a new tab with the location of the entry when double clicked', function * () {
      const site = Brave.server.url(browseableSiteUrl)
      const target = 'table.sortableTable td.title[data-sort="' + browseableSiteTitle + '"]'
      yield this.app.client
        .waitForVisible(target)
        .doubleClick(target)
        .waitForUrl(site)
        .waitForBrowserWindow()
        .waitForTabCount(2)
    })
  })

  describe('multi-select behavior', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSites(this.app.client)
    })

    it('selects multiple rows when clicked with cmd/control', function * () {
      yield this.app.client
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
    it('selects multiple contiguous rows when shift clicked', function * () {
      yield this.app.client
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable td.title[data-sort="https://brave.com/test"]')
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
        .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
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
        .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable td.title[data-sort="https://brave.com/test"]')
        .waitForVisible('table.sortableTable td.title[data-sort="https://www.facebook.com"]')
        // reset state
        // key depressed
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable tr.selected td.title[data-sort="Brave"]')
    })
    it('deselects everything if something other than the table is clicked', function * () {
      yield this.app.client
        .tabByUrl(aboutHistoryUrl)
        .loadUrl(aboutHistoryUrl)
        // Click one bookmark, to select it
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        // Click the search box; this should dismiss and release selection
        .click('input#historySearch')
        .waitForElementCount('table.sortableTable tr.selected td.title[data-sort="Brave"]', 0)
    })
    it('does not lose selection if table is sorted', function * () {
      yield this.app.client
        .tabByUrl(aboutHistoryUrl)
        .loadUrl(aboutHistoryUrl)
        // Click one bookmark, to select it
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        // Click the "title" header; this sort the rows (but keep selection)
        .click('table.sortableTable th')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
    })
  })
})
