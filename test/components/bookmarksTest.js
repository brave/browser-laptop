/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, navigator, navigatorNotBookmarked, saveButton, deleteButton} = require('../lib/selectors')

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
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
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

    describe('saved with a title', function () {
      before(function * () {
        yield this.app.client
          .click(saveButton)
      })

      it('displays title', function * () {
        yield this.app.client
          .waitUntil(function () {
            return this.getText('.bookmarkText')
              .then((val) => val === 'Page 1')
          })
      })

      describe('and then removed', function () {
        before(function * () {
          yield this.app.client
            .waitForVisible(navigator)
            .moveToObject(navigator)
            .waitForVisible(navigatorNotBookmarked)
            .click(navigatorNotBookmarked)
            .waitForVisible(deleteButton)
            .click(deleteButton)
        })
        it('removes the bookmark from the toolbar', function * () {
          yield this.app.client
            .waitForExist('.bookmarkText', 1000, true)
        })
      })
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
        .waitForVisible(saveButton + ':not([disabled]')
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

    describe('saved without a title', function () {
      before(function * () {
        yield this.app.client
          .click(saveButton)
      })
      it('displays URL', function * () {
        const page1Url = this.page1Url
        yield this.app.client
          .waitUntil(function () {
            return this.getText('.bookmarkText')
              .then((val) => val === page1Url)
          })
      })
      describe('and then removed', function () {
        before(function * () {
          yield this.app.client
            .click(navigatorNotBookmarked)
            .waitForExist(deleteButton)
            .click(deleteButton)
        })
        it('removes the bookmark from the toolbar', function * () {
          yield this.app.client
            .waitForExist('.bookmarkText', 1000, true)
        })
      })
    })
  })
})
