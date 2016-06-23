/* global describe, it, before */

const Brave = require('../lib/brave')
const { getTargetAboutUrl } = require('../../js/lib/appUrlUtil')
const { errorContent, errorUrl } = require('../lib/selectors')

describe('errorPage', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForBrowserWindow()
      .waitForVisible('#window')
  })

  describe('DNS error', function () {
    before(function * () {
      this.url = 'http://fake.nosuchdomain/'
      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .url(this.url)
        .waitForUrl(getTargetAboutUrl('about:error'))
    })

    it('should load the error page', function * () {
      yield this.app.client
        .waitForVisible(errorContent)
        .waitForVisible('span[data-l10n-id=nameNotResolved]')
        .waitForVisible('span[data-l10n-id=errorReload]')
        .waitForVisible(errorUrl)
        .getText(errorUrl).should.eventually.be.equal(this.url)
        .isVisible('span[data-l10n-id=errorReload]').should.eventually.be.true
        .isVisible('span[data-l10n-id=back]').should.eventually.be.true
    })

    it('should go back to newtab when back is clicked', function * () {
      yield this.app.client
        .leftClick('span[data-l10n-id=back]')
        .waitForUrl(Brave.newTabUrl)
    })

    // TODO(bridiver) - need a better way to test this
    it.skip('should attempt a reload when reload is clicked', function * () {
      yield this.app.client
        .leftClick('span[data-l10n-id=errorReload]')
        .waitForUrl(getTargetAboutUrl('about:error'))
        // still no back button for the url
        .waitForVisible(errorUrl)
        .getText(errorUrl).should.eventually.be.equal(this.url)
        .isVisible('span[data-l10n-id=back]').should.eventually.be.false
    })
  })
})
