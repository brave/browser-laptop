/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, navigator, navigatorNotBookmarked, saveButton} = require('../lib/selectors')

describe('bookmarks', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForEnabled(urlInput)
  }

  describe('with title', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')

      yield setup(this.app.client)

      yield this.app.client
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .moveToObject(navigator)
        .waitForExist(navigatorNotBookmarked)
        .moveToObject(navigator)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
    })

    it('fills in the title field', function * () {
      yield this.app.client
        .waitForExist('#bookmarkName input')
        .getValue('#bookmarkName input').should.eventually.be.equal('Page 1')
    })

    it('fills in the url field', function * () {
      yield this.app.client
        .waitForExist('#bookmarkLocation input')
        .getValue('#bookmarkLocation input').should.eventually.be.equal(this.page1Url)
    })
  })

  describe('without title', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page_no_title.html')

      yield setup(this.app.client)

      yield this.app.client
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .moveToObject(navigator)
        .waitForExist(navigatorNotBookmarked)
        .moveToObject(navigator)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
    })

    it('leaves the title field blank', function * () {
      yield this.app.client
        .waitForExist('#bookmarkName input')
        .getValue('#bookmarkName input').should.eventually.be.equal('')
    })

    it('fills in the url field', function * () {
      yield this.app.client
        .waitForExist('#bookmarkLocation input')
        .getValue('#bookmarkLocation input').should.eventually.be.equal(this.page1Url)
    })
  })
})
