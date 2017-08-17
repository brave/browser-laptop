/* global describe, it, beforeEach, afterEach */

const Brave = require('../lib/brave')
const profilerUtil = require('../lib/profilerUtil')
const {urlInput} = require('../lib/selectors')
const userProfiles = require('../lib/userProfiles')

describe('Performance startup', function () {
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
    this.url = Brave.server.url('page1.html')
    yield setupBrave()
  })

  afterEach(function * () {
    yield Brave.stopApp(true, RESTART_TIMEOUT)
  })

  this.afterAll(function * () {
    yield profilerUtil.uploadTravisArtifacts()
  })

  describe('type a URL and navigate', function () {
    function * runStory () {
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForUrl(Brave.newTabUrl, 10000, 250)
        .waitForBrowserWindow()
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend('shortcut-focus-url')
        .waitForVisible(urlInput)
        .waitForElementFocus(urlInput)
        .pause(500)
      for (let i = 0; i < this.url.length; i++) {
        yield Brave.app.client
          .keys(this.url[i])
          .pause(30)
      }
      yield Brave.app.client
        .keys(Brave.keys.ENTER)
        .waitForUrl(this.url)
    }

    it('fresh', function * () {
      // restart to keep it consistent with other tests
      yield restart()
      yield profilerUtil.profile(runStory.bind(this), 'startup--navigate-manually--fresh')
    })

    it('4000 bookmarks', function * () {
      yield userProfiles.addBookmarks4000(Brave.app.client)
      yield restart()
      yield profilerUtil.profile(runStory.bind(this), 'startup--navigate-manually--4000-bookmarks')
    })

    it('50 tabs', function * () {
      yield userProfiles.addTabs50(Brave.app.client)
      yield restart()
      yield profilerUtil.profile(runStory.bind(this), 'startup--navigate-manually--50-tabs')
    })
  })
})
