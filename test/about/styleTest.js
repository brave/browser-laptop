/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

describe('about:style', function () {
  Brave.beforeAll(this)
  before(function * () {
    const url = getTargetAboutUrl('about:style')
    yield this.app.client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .waitForExist('.tab[data-frame-key="1"]')
      .tabByIndex(0)
      .loadUrl(url)
  })

  it('displays the title', function * () {
    yield this.app.client
      .getText('.typography').should.eventually.be.equal('Typography')
  })
})
