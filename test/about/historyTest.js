/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutHistoryUrl = getTargetAboutUrl('about:history')

describe('about:history', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .addSite({ location: 'https://brave.com', title: 'Brave' })
      .addSite({ location: 'https://brave.com/test', customTitle: 'customTest' })
      .addSite({ location: 'https://www.youtube.com' })
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
})
