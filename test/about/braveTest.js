/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

describe('about:brave tests', function () {
  Brave.beforeAll(this)
  before(function * () {
    const url = getTargetAboutUrl('about:brave')
    yield this.app.client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
      .loadUrl(url)
  })

  describe('when showing versions', function () {
    it('lists Brave', function * () {
      yield this.app.client
        .waitUntil(function () {
          return this.getText('table.sortableTable td[data-sort="Brave"]')
            .then((textValue) => {
              return textValue && String(textValue).length > 0 && String(textValue) !== 'null'
            })
        })
    })
    it('lists Muon', function * () {
      yield this.app.client
        .waitUntil(function () {
          return this.getText('table.sortableTable td[data-sort="Muon"]')
            .then((textValue) => {
              return textValue && String(textValue).length > 0 && String(textValue) !== 'null'
            })
        })
    })
    it('lists Update Channel', function * () {
      yield this.app.client
        .waitUntil(function () {
          return this.getText('table.sortableTable td[data-sort="Update Channel"]')
            .then((textValue) => {
              return textValue && String(textValue).length > 0 && String(textValue) !== 'null'
            })
        })
    })
  })
})
