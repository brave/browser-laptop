/* global describe, it, before, after */

const Brave = require('../lib/brave')
const selectors = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')

describe('sessionStore', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(selectors.urlInput)
    Brave.addCommands()
  }

  describe('state is preserved', function () {
    Brave.beforeAllServerSetup(this)
    before(function *() {
      const page1Url = Brave.server.url('page1.html')
      this.timeout(30000)
      yield Brave.startApp()
      yield setup(Brave.app.client)

      yield Brave.navigate(Brave.app.client, page1Url)
      yield Brave.app.client.waitForExist(selectors.navigatorNotBookmarked)
      yield Brave.app.client.addSite({
        location: page1Url,
        title: 'some page',
        isPrivate: false
      }, siteTags.BOOKMARK)
      yield Brave.app.client
        .moveToObject(selectors.urlInput)
        .waitForExist(selectors.navigatorBookmarked)
      yield Brave.stopApp()
      yield Brave.startApp(false)
      yield setup(Brave.app.client)
    })

    after(function *() {
      yield Brave.stopApp()
    })

    it('windowState by preserving open page', function *() {
      const page1Url = Brave.server.url('page1.html')
      yield Brave.app.client
        .moveToObject(selectors.urlInput)
        .waitUntil(function () {
          return this.getValue(selectors.urlInput).then(val => val === page1Url)
        })
    })

    it('appstate by preserving a bookmark', function *() {
      yield Brave.app.client.waitForExist(selectors.navigatorBookmarked)
    })
  })
})
