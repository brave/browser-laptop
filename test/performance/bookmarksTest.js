/* global describe, it, beforeEach, afterEach */

const Brave = require('../lib/brave')
const {navigatorBookmarked, navigatorNotBookmarked, doneButton} = require('../lib/selectors')
const profilerUtil = require('../lib/profilerUtil')
const userProfiles = require('../lib/userProfiles')

describe('Performance bookmarks', function () {
  Brave.beforeAllServerSetup(this)
  const RESTART_TIMEOUT = 5000
  let inspectPort = 9223

  function * setup () {
    Brave.addCommands()
  }

  function * setupBrave (enableInspector) {
    const extraArgs = []
    if (enableInspector) {
      extraArgs.push(`--debug=${inspectPort}`)
      inspectPort += 1
    }
    yield Brave.startApp(extraArgs)
    yield setup(Brave.app.client)
  }

  function * restart () {
    yield Brave.stopApp(false, RESTART_TIMEOUT)
    yield setupBrave(true)
  }

  beforeEach(function * () {
    this.page1Url = Brave.server.url('page1.html')
    yield setupBrave()
  })

  afterEach(function * () {
    yield Brave.stopApp(true, RESTART_TIMEOUT)
  })

  this.afterAll(function * () {
    yield profilerUtil.uploadTravisArtifacts()
  })

  describe('adding a bookmark', function () {
    function * runPreStory () {
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl, 10000, 250)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
    }

    function * runStory () {
      yield Brave.app.client
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(this.page1Url, 'Page 1')
        .waitForEnabled(doneButton)
        .click(doneButton)
        .activateURLMode()
        .waitForVisible(navigatorBookmarked)
    }

    it('fresh', function * () {
      // restart to keep it consistent with other tests
      yield restart()
      yield runPreStory.call(this)
      yield profilerUtil.profile(runStory.bind(this), 'bookmarks--add-bookmark--fresh')
    })

    it('4000 bookmarks', function * () {
      yield userProfiles.addBookmarks4000(Brave.app.client)
      yield restart()
      yield runPreStory.call(this)
      yield profilerUtil.profile(runStory.bind(this), 'bookmarks--add-bookmark--4000-bookmarks')
    })

    it('50 tabs', function * () {
      yield userProfiles.addTabs50(Brave.app.client)
      yield restart()
      yield runPreStory.call(this)
      yield profilerUtil.profile(runStory.bind(this), 'bookmarks--add-bookmark--50-tabs')
    })
  })
})
