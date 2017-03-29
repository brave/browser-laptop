/* global describe, it, before */

const Brave = require('../lib/brave')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const {errorContent, errorUrl, urlInput} = require('../lib/selectors')

describe('errorPage', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield this.app.client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
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
        .waitForVisible('button[data-l10n-id=errorReload]')
        .waitForVisible(errorUrl)
        .waitForTextValue(errorUrl, this.url)
        .waitForVisible('button[data-l10n-id=errorReload]')
        .waitForVisible('button[data-l10n-id=back]')
    })

    it('should go back to newtab when back is clicked', function * () {
      yield this.app.client
        .waitForUrl(getTargetAboutUrl('about:error'))
        .waitForVisible('button[data-l10n-id=back]')
        .leftClick('button[data-l10n-id=back]', 5, 5)
        .waitForUrl(Brave.newTabUrl)
    })

    // TODO(bridiver) - need a better way to test this
    it.skip('should attempt a reload when reload is clicked', function * () {
      yield this.app.client
        .waitForUrl(getTargetAboutUrl('about:error'))
        .waitForVisible('button[data-l10n-id=errorReload]')
        .leftClick('button[data-l10n-id=errorReload]')
        .waitForUrl(getTargetAboutUrl('about:error'))
        // still no back button for the url
        .waitForVisible(errorUrl)
        .waitForTextValue(errorUrl, this.url)
        .waitForElementCount('button[data-l10n-id=back]', 0)
    })
  })
})
