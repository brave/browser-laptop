/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, urlBarSuggestions, urlbarIcon, reloadButton} = require('../lib/selectors')
const searchProviders = require('../../js/data/searchProviders')
const config = require('../../js/constants/config')

describe('urlBar tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForEnabled(urlInput)
  }

  function selectsText (client, text = config.defaultUrl) {
    return client.waitUntil(function () {
      return this.getSelectedText().then(function (value) { return value === text })
    })
  }

  describe('typing speed', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client
        .onClearBrowsingData({browserHistory: true})
        .addSite({ location: 'https://brave.com', title: 'Brave' })
    })

    // OMG, Brad would hate this test!
    const typingDelays = [0, 2, 11, 53, 101, 151, 251]
    typingDelays.forEach((delay) => {
      it(`delay of ${delay}ms/character fills correctly`, function * () {
        const input = 'brave.com'
        yield this.app.client
          .keys(Brave.keys.ESCAPE)
          .waitUntil(function () {
            return this.getValue(urlInput).then((val) => val === '')
          })
          .waitForSelectedText('')
        for (let i = 0; i < input.length; i++) {
          yield this.app.client
            .keys(input[i])
            .pause(delay)
        }
        yield this.app.client
          .waitForSelectedText('')
          .waitUntil(function () {
            return this.getValue(urlInput)
              .then((val) => val === 'brave.com')
          })
          .keys(Brave.keys.ESCAPE)
      })
    })
  })

  describe('autocomplete', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })
      yield this.app.client
        .onClearBrowsingData({browserHistory: true})
        .addSite({ location: 'https://brave.com', title: 'Brave' })
        .addSite({ location: 'https://brave.com/test' })
        .addSite({ location: 'https://www.youtube.com' })
        .addSite({ location: 'http://uncrate.com' })
    })

    it('un does not autocomplete to undefined', function * () {
      yield this.app.client
        .keys('un')
        .waitForInputText(urlInput, 'uncrate.com')
    })

    it('autocompletes without protocol', function * () {
      // now type something
      yield this.app.client
        .setInputText(urlInput, '')
        .keys('br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'brave.com')
        })
    })

    it('autocompletes with protocol', function * () {
      // now type something
      yield this.app.client
        .keys('https://br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
    })

    it('autocompletes without www.', function * () {
      // now type something
      yield this.app.client
        .keys('you')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'youtube.com')
        })
    })

    it('autofills from selected suggestion', function * () {
      // now type something
      yield this.app.client
        .keys('https://br')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
        // hit down
        .keys(Brave.keys.DOWN)
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com/test')
        })
        // hit up
        .keys(Brave.keys.UP)
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'https://brave.com')
        })
    })

    it('autocompletes without losing characters', function * () {
      yield this.app.client
        .keys('a\uE008\uE008b\uE008\uE008o\uE008\uE008u\uE008\uE008t\uE008\uE008x')
        .waitUntil(function () {
          return this.getValue(urlInput)
            .then((val) => val === 'aboutx')
        })
    })

    it('does not show suggestions on focus', function * () {
      yield this.app.client
        .keys('brave')
        .waitUntil(function () {
          return this.isExisting(urlBarSuggestions).then((exists) => exists === true)
        })
        .ipcSend('shortcut-focus-url')
        .waitForElementFocus(urlInput)
        .waitUntil(function () {
          return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
        })
    })

    describe('with scrolling match', function () {
      it('does not show suggestions on focus', function * () {
        yield this.app.client
          .addSite({ location: 'https://brave.com/test2' })
          .addSite({ location: 'https://brave.com/test3' })
          .addSite({ location: 'https://brave.com/test4' })
          .addSite({ location: 'https://brianbondy.com/test4' })
          .resizeWindow(500, 300)
          .setValue(urlInput, 'b')
          .waitForVisible(urlBarSuggestions)
          .moveToObject(urlBarSuggestions, 0, 50)
          .moveToObject(urlBarSuggestions, 0, 100)
          .moveToObject(urlBarSuggestions, 0, 150)
          .keys('ra')
          .execute(function (urlBarSuggestions) {
            document.querySelector(urlBarSuggestions).scrollTop = 200
          }, urlBarSuggestions)
        yield selectsText(this.app.client, 've.com')
      })
    })
  })

  describe('typing', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })

      yield this.app.client
        .addSite({ location: 'https://brave.com', title: 'Brave' })

      // now type something
      yield this.app.client
        .setValue(urlInput, 'b')
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => val.startsWith('b'))
        })
        .waitForExist(urlBarSuggestions + ' li')
    })

    it('sets the value to "b"', function * () {
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'brave.com')
      })
    })

    it('clears the selected text', function * () {
      // Since now the first letter will trigger the autocomplete
      // expect the selected text to be part of the first suggestion
      // in the list
      yield selectsText(this.app.client, 'rave.com')
    })

    describe('shortcut-focus-url', function () {
      before(function * () {
        yield this.app.client
          .ipcSend('shortcut-focus-url')
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function * () {
        // Since now the first letter will trigger the autocomplete
        // expect the selected text to be the first suggestion in the list
        yield selectsText(this.app.client, 'brave.com')
      })

      it('has the search icon', function * () {
        yield this.app.client.waitForExist('.urlbarIcon.fa-search')
      })
    })

    describe('type escape once with suggestions', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'google')
          .waitForExist(urlBarSuggestions + ' li')

          .keys(Brave.keys.ESCAPE)
          .waitForElementFocus(urlInput)
      })
      it('does select the urlbar text', function * () {
        yield selectsText(this.app.client, this.page)
      })

      it('does revert the urlbar text', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(this.page)
      })
    })

    describe('type escape once with no suggestions', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'random-uuid-d63ecb78-eec8-4c08-973b-fb39cb5a6f1a')

          .keys(Brave.keys.ESCAPE)
          .waitForElementFocus(urlInput)
      })
      it('does select the urlbar text', function * () {
        yield selectsText(this.app.client, this.page)
      })

      it('does revert the urlbar text', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(this.page)
      })
    })

    describe('type escape twice', function () {
      before(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .setValue(urlInput, 'blah')
          // hit escape
          .keys(Brave.keys.ESCAPE)
          .waitForElementFocus(urlInput)
          .keys(Brave.keys.ESCAPE)
      })

      it('selects the urlbar text', function * () {
        yield selectsText(this.app.client, this.page)
      })

      it('sets the urlbar text to the webview src', function * () {
        yield this.app.client.getValue(urlInput).should.eventually.be.equal(this.page)
      })
    })

    describe('submitting by typing a URL', function () {
      before(function * () {
        const url = Brave.server.url('page1.html')
        return yield this.app.client.ipcSend('shortcut-focus-url')
          .setValue(urlInput, url)
          // hit enter
          .keys(Brave.keys.ENTER)
      })

      it('changes the webview location', function * () {
        const url = Brave.server.url('page1.html')
        yield this.app.client
          .tabByIndex(0)
          .waitForUrl(url)
      })
    })
  })

  describe('search engine go key', function () {
    Brave.beforeAll(this)
    const entries = searchProviders.providers

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
    })

    beforeEach(function * () {
      yield this.app.client
        .setInputText(urlInput, '')
    })

    entries.forEach((entry) => {
      describe(entry.name, function () {
        it('has the icon', function * () {
          yield this.app.client
            .keys(entry.shortcut + ' ')
            .waitForExist(urlbarIcon)
            .waitUntil(function () {
              return this
                .getCssProperty(urlbarIcon, 'background-image')
                .then((backgroundImage) => backgroundImage.value === `url("${entry.image}")`)
            })
            .waitForElementCount('.urlbarIcon.fa-search', 0)
        })
      })
    })
  })

  describe('search engine icon clears', function () {
    Brave.beforeAll(this)
    const entries = searchProviders.providers

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
    })

    beforeEach(function * () {
      const entry = entries[0]
      yield this.app.client
        .setInputText(urlInput, '')
        .keys(`${entry.shortcut} hi`)
        .waitUntil(function () {
          return this
            .getCssProperty(urlbarIcon, 'background-image')
            .then((backgroundImage) => backgroundImage.value === `url("${entry.image}")`)
        })
    })

    it('clears last search engine when removed', function * () {
      yield this.app.client
        .setInputText(urlInput, '.')
        .waitForElementCount(urlbarIcon + '.fa-search', 1)
    })
    it('clears last search engine when searching', function * () {
      yield this.app.client
        .keys(Brave.keys.ENTER)
        .waitForElementCount(urlbarIcon + '.fa-lock', 1)
    })
    it('clears last search engine when loading arbitrary page', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(Brave.server.url('page1.html'))
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(urlbarIcon + '.fa-unlock', 1)
    })
  })

  const tabLoadingTest = function * () {
    const coffee = 'coffee'
    yield this.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .keys(coffee)
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === coffee)
      })
      .click('[data-test-id="tab"][data-frame-key="1"]')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val !== coffee)
      })
      .click('[data-test-id="tab"][data-frame-key="2"]')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === coffee)
      })
  }

  describe('location bar with loaded tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')
      this.page2Url = Brave.server.url('page2.html')
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })
      .tabByIndex(0)
      .loadUrl(this.page1Url)
      .windowByUrl(Brave.browserWindowUrl)
      .newTab()
      .waitForUrl(Brave.newTabUrl)
      .tabByIndex(1)
      .loadUrl(this.page2Url)
      .waitForUrl(this.page2Url)
    })

    it('Retains user input on tab switches', tabLoadingTest)
  })

  describe('location bar with new tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client.waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === '')
      })
      .windowByUrl(Brave.browserWindowUrl)
      .newTab()
      .waitForUrl(Brave.newTabUrl)
      .tabByIndex(1)
    })

    it('Retains user input on tab switches', tabLoadingTest)
  })

  describe('loading same URL as current page with changed input', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
        .tabByIndex(0)
        .loadUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .setInputText(urlInput, '')
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => val === '')
        })
        .windowByUrl(Brave.browserWindowUrl)
        .click(reloadButton)
    })

    it('reverts the URL', function * () {
      const page1Url = this.page1Url
      yield this.app.client
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => {
            return val === page1Url
          })
        })
    })
  })

  describe('loading different URL as current page with changed input', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')
      this.page2Url = Brave.server.url('page2.html')
      yield setup(this.app.client)
      yield this.app.client
        .waitForExist(urlInput)
        .waitForElementFocus(urlInput)
        .tabByIndex(0)
        .loadUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .setInputText(urlInput, '')
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(0)
        .loadUrl(this.page2Url)
        .windowByUrl(Brave.browserWindowUrl)
    })

    it('reverts the URL', function * () {
      const page2Url = this.page2Url
      yield this.app.client
        .waitUntil(function () {
          return this.getValue(urlInput).then((val) => {
            return val === page2Url
          })
        })
    })
  })
})
