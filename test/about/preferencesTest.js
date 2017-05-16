/* global describe, it, beforeEach, before, after */

const Brave = require('../lib/brave')
const {urlInput, homepageInput} = require('../lib/selectors')
const settings = require('../../js/constants/settings')
const {startsWithOption, newTabMode} = require('../../app/common/constants/settingsEnums')

const prefsUrl = 'about:preferences'

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

function * setupBrave (client) {
  Brave.addCommands()
}

describe('General Panel', function () {
  describe('homepage', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('homepage displays punycode', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(homepageInput)
        .click(homepageInput)
        .keys([Brave.keys.END, 'а'])
        .waitForInputText(homepageInput, 'https://www.brave.xn--com-8cd/')
    })

    it('homepage can be backspaced', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(homepageInput)
        .click(homepageInput)
        .keys(Brave.keys.END)
        .typeText(homepageInput, ['/', '1', Brave.keys.BACKSPACE, Brave.keys.BACKSPACE, Brave.keys.BACKSPACE], 'https://www.brave.com')
        .waitForInputText(homepageInput, 'https://www.brave.co')
    })

    it('multiple homepages direct input', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(homepageInput)
        .click(homepageInput)
        .keys(Brave.keys.END)
        .typeText(homepageInput, '|https://duckduckgo.com', 'https://www.brave.com/')
    })
  })

  describe('homepage multiple', function () {
    Brave.beforeAllServerSetup(this)

    before(function * () {
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
    })

    it('from scratch', function * () {
      const page1 = 'https://start.duckduckgo.com/'
      const page2 = 'https://brave.com/'

      yield setup(Brave.app.client)
      yield Brave.app.client.changeSetting(settings.STARTUP_MODE, startsWithOption.HOMEPAGE)
      // TODO remove when #6920 is fixed
      yield Brave.app.client.changeSetting(settings.NEWTAB_MODE, newTabMode.HOMEPAGE)
      yield Brave.app.client.changeSetting(settings.HOMEPAGE, `${page1}|${page2}`)

      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return (val.value.frames.length === 2 &&
              val.value.frames[0].location === page1 &&
              val.value.frames[1].location === page2
            )
          })
        })
    })

    after(function * () {
      yield Brave.stopApp()
    })
  })
})
