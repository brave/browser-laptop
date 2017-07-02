/* global describe, it, before, beforeEach */

const assert = require('assert')
const Brave = require('../lib/brave')
const {urlInput, urlBarSuggestions, urlBarIcon, reloadButton} = require('../lib/selectors')
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
        .onClearBrowsingData('browserHistory', true)
        .addSite({ location: 'https://brave.com', title: 'Brave' })
    })

    // OMG, Brad would hate this test!
    const typingDelays = [0, 2, 11, 53, 101, 151, 251]
    typingDelays.forEach((delay) => {
      it(`delay of ${delay}ms/character fills correctly`, function * () {
        const input = 'brave.com'
        yield this.app.client
          .keys(Brave.keys.ESCAPE)
          .waitForInputText(urlInput, '')
          .waitForSelectedText('')
        for (let i = 0; i < input.length; i++) {
          yield this.app.client
            .keys(input[i])
            .pause(delay)
        }
        yield this.app.client
          .waitForSelectedText('')
          .waitForInputText(urlInput, 'brave.com')
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
        .waitForInputText(urlInput, '')

      yield this.app.client
        .onClearBrowsingData('browserHistory', true)
        .addSite({ location: 'https://brave.com', title: 'Brave' })
        .addSite({ location: 'https://brave.com/test' })
        .addSite({ location: 'https://www.youtube.com' })
        .addSite({ location: 'http://uncrate.com' })
    })

    describe('press backspace key', function () {
      beforeEach(function * () {
        yield this.app.client
          .setInputText(urlInput, '')
          .keys('br')
          .waitForInputText(urlInput, 'brave.com')
          .waitForSelectedText('ave.com')
          .keys(Brave.keys.BACKSPACE)
      })

      it('clears the selection', function * () {
        yield this.app.client
          .waitForSelectedText('')
      })

      it('removes the autocomplete value', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'br')
      })

      describe('with typing', function () {
        beforeEach(function * () {
          yield this.app.client
            .keys('x')
        })

        it('has no selection', function * () {
          yield this.app.client
            .waitForSelectedText('')
        })

        it('inserts typing at the current cursor location', function * () {
          yield this.app.client
            .waitForInputText(urlInput, 'brx')
        })
      })
    })

    describe('press left arrow key', function () {
      beforeEach(function * () {
        yield this.app.client
          .setInputText(urlInput, '')
          .keys('br')
          .waitForInputText(urlInput, 'brave.com')
          .waitForSelectedText('ave.com')
          .keys(Brave.keys.LEFT)
      })

      it('clears the selection', function * () {
        yield this.app.client
          .waitForSelectedText('')
      })

      it('keeps the autocomplete value', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'brave.com')
      })

      describe('with typing', function () {
        beforeEach(function * () {
          yield this.app.client
            .keys('a')
        })

        it('has no selection', function * () {
          yield this.app.client
            .waitForSelectedText('')
        })

        it('inserts typing at the current cursor location', function * () {
          yield this.app.client
            .waitForInputText(urlInput, 'braave.com')
        })
      })
    })

    describe('typing prefix with characters from "https" prefix', function () {
      beforeEach(function * () {
        yield this.app.client
          .addSite({ location: 'https://slo-tech.com', title: 'title' })
          .setInputText(urlInput, '')
          .keys('s')
      })
      it('should autocomplete to the domain', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'slo-tech.com')
      })
    })

    describe('typing with characters that do not match prefix should not select first item', function () {
      beforeEach(function * () {
        yield this.app.client
          .addSite({ location: 'https://slo-tech.com', title: 'title' })
          .setInputText(urlInput, '')
          .keys('o')
      })
      it('should not autocomplete to the domain', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'o')
      })
    })

    describe('typing with characters that do not match prefix should not select first item', function () {
      beforeEach(function * () {
        yield this.app.client
          .addSite({ location: 'https://slo-tech.com', title: 'title' })
          .setInputText(urlInput, '')
          .keys('o')
      })
      it('should not autocomplete to the domain', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'o')
      })
    })

    describe('suffix', function () {
      beforeEach(function * () {
        yield this.app.client
          .setInputText(urlInput, '')
          .keys('b')
          .waitForInputText(urlInput, 'brave.com')
          .keys(Brave.keys.DOWN)
          .keys(Brave.keys.DOWN)
      })
      it('should clear when it is not a prefix match', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'b')
          .keys(Brave.keys.UP)
          .waitForInputText(urlInput, 'brave.com/test')
      })
    })

    describe('press right arrow key', function () {
      beforeEach(function * () {
        yield this.app.client
          .setInputText(urlInput, '')
          .keys('br')
          .waitForInputText(urlInput, 'brave.com')
          .waitForSelectedText('ave.com')
          .keys(Brave.keys.RIGHT)
      })

      it('clears the selection', function * () {
        yield this.app.client
          .waitForSelectedText('')
      })

      it('keeps the autocomplete value', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'brave.com')
      })

      describe('with typing', function () {
        beforeEach(function * () {
          yield this.app.client
            .keys('a')
        })

        it('has no selection', function * () {
          yield this.app.client
            .waitForSelectedText('')
        })

        it('inserts typing at the current cursor location', function * () {
          yield this.app.client
            .waitForInputText(urlInput, 'brave.coma')
        })
      })
    })

    describe('press keyboard shortcut', function () {
      beforeEach(function * () {
        this.page = Brave.server.url('page1.html')
        return yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.page)
          .windowByUrl(Brave.browserWindowUrl)
      })

      it('does not show autosuggest', function * () {
        return yield this.app.client
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .keys(Brave.keys.CONTROL)
          .keys('c')
          .keys(Brave.keys.NULL) // needed to release the modifier key
          .pause(100) // wait for the suggestions
          .isExisting(urlBarSuggestions).then((isExisting) => assert(!isExisting))
      })
    })

    describe('press escape key', function () {
      beforeEach(function * () {
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
        yield this.app.client.waitForInputText(urlInput, this.page)
      })
    })

    describe('type "un"', function () {
      it('un does not autocomplete to undefined', function * () {
        yield this.app.client
          .keys('un')
          .waitForInputText(urlInput, 'uncrate.com')
      })
    })

    describe('start typing url without protocol', function () {
      it('autocompletes without protocol', function * () {
        // now type something
        yield this.app.client
          .setInputText(urlInput, '')
          .keys('br')
          .waitForInputText(urlInput, 'brave.com')
      })
    })

    describe('start typing url with protocol', function () {
      it('autocompletes with protocol', function * () {
        // now type something
        yield this.app.client
          .keys('https://br')
          .waitForInputText(urlInput, 'https://brave.com')
      })
    })

    describe('start typing url without wwww', function () {
      it('autocompletes without www.', function * () {
        // now type something
        yield this.app.client
          .keys('you')
          .waitForInputText(urlInput, 'youtube.com')
      })
    })

    describe('highlight suggestions with tab', function () {
      it('autofills from selected suggestion', function * () {
        // now type something
        yield this.app.client
          .keys('https://br')
          .waitForInputText(urlInput, 'https://brave.com')
          // hit down
          .keys(Brave.keys.TAB)
          .waitForInputText(urlInput, 'https://brave.com/test')
          // hit up
          .keys(Brave.keys.SHIFT + Brave.keys.TAB)
          .waitForInputText(urlInput, 'https://brave.com')
      })
    })

    describe('highlight suggestions', function () {
      it('autofills from selected suggestion', function * () {
        // now type something
        yield this.app.client
          .keys('https://br')
          .waitForInputText(urlInput, 'https://brave.com')
          // hit down
          .keys(Brave.keys.DOWN)
          .waitForInputText(urlInput, 'https://brave.com/test')
          // hit up
          .keys(Brave.keys.UP)
          .waitForInputText(urlInput, 'https://brave.com')
      })
    })

    describe('type non-visible keys', function () {
      it('autocompletes without losing characters', function * () {
        // ue008 is left shift
        yield this.app.client
          .keys('a\uE008\uE008b\uE008\uE008o\uE008\uE008u\uE008\uE008t\uE008\uE008x')
          .waitForInputText(urlInput, 'aboutx')
      })
    })

    describe('focus urlbar', function () {
      it('does not show suggestions', function * () {
        yield this.app.client
          .keys('brave')
          .waitForVisible(urlBarSuggestions)
          .ipcSend('shortcut-focus-url')
          .waitForElementFocus(urlInput)
          .waitForElementCount(urlBarSuggestions, 0)
      })
    })
  })

  describe('with scrolling match', function () {
    Brave.beforeEach(this)

    it('typing in the urlbar should override mouse hover for suggestions', function * () {
      yield this.app.client
        .addSite({ location: 'https://brave.com', title: 'Brave' })
        .addSite({ location: 'https://brave.com/test' })
        .addSite({ location: 'https://brave.com/test2' })
        .addSite({ location: 'https://brave.com/test3' })
        .addSite({ location: 'https://brave.com/test4' })
        .addSite({ location: 'https://brianbondy.com/test4' })
        .resizeWindow(500, 300)
        .setValue(urlInput, 'b')
        .waitForVisible(urlBarSuggestions)
        // highlight for autocomplete brianbondy.com
        .moveToObject(urlBarSuggestions, 0, 100)
      yield selectsText(this.app.client, 'rave.com/test2')
        .keys('rian')
        .execute(function (urlBarSuggestions) {
          document.querySelector(urlBarSuggestions).scrollTop = 200
        }, urlBarSuggestions)
      yield selectsText(this.app.client, 'bondy.com/test4')
    })
  })

  describe('typing', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
        .waitForInputText(urlInput, '')
        .setValue(urlInput, 'br')
    })

    it('sets the value to "br"', function * () {
      yield this.app.client.waitForInputText(urlInput, 'br')
    })

    it('clears the selected text', function * () {
      yield selectsText(this.app.client, '')
    })

    describe('shortcut-focus-url', function () {
      beforeEach(function * () {
        yield this.app.client
          .ipcSend('shortcut-focus-url')
      })

      it('has focus', function * () {
        yield this.app.client.waitForElementFocus(urlInput)
      })

      it('selects the text', function * () {
        yield selectsText(this.app.client, 'br')
      })

      it('has the search icon', function * () {
        yield this.app.client.waitForExist('[data-test-id="urlBarIcon"].fa-search')
      })
    })

    describe('press left arrow key', function () {
      beforeEach(function * () {
        yield this.app.client
          .keys(Brave.keys.LEFT)
      })

      it('clears the selection', function * () {
        yield this.app.client
          .waitForSelectedText('')
      })

      describe('with typing', function () {
        beforeEach(function * () {
          yield this.app.client
            .keys('x')
        })

        it('has no selection', function * () {
          yield this.app.client
            .waitForSelectedText('')
        })

        it('inserts typing at the current cursor location', function * () {
          yield this.app.client
            .waitForInputText(urlInput, 'bxr')
        })
      })
    })

    describe('press backspace key', function () {
      beforeEach(function * () {
        yield this.app.client
          .keys(Brave.keys.BACKSPACE)
      })

      it('clears the selection', function * () {
        yield this.app.client
          .waitForSelectedText('')
      })

      it('deletes the last character', function * () {
        yield this.app.client
          .waitForInputText(urlInput, 'b')
      })

      describe('with typing', function () {
        beforeEach(function * () {
          yield this.app.client
            .keys('x')
        })

        it('has no selection', function * () {
          yield this.app.client
            .waitForSelectedText('')
        })

        it('inserts typing at the current cursor location', function * () {
          yield this.app.client
            .waitForInputText(urlInput, 'bx')
        })
      })
    })

    describe('press escape', function () {
      beforeEach(function * () {
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
        yield this.app.client.waitForInputText(urlInput, this.page)
      })
    })

    describe('submitting by typing a URL', function () {
      beforeEach(function * () {
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
            .waitForExist(urlBarIcon)
            .waitUntil(function () {
              return this
                .getCssProperty(urlBarIcon, 'background-image')
                .then((backgroundImage) => backgroundImage.value === `url("${entry.image}")`)
            })
            .waitForElementCount('[data-test-id="urlBarIcon"].fa-search', 0)
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
            .getCssProperty(urlBarIcon, 'background-image')
            .then((backgroundImage) => backgroundImage.value === `url("${entry.image}")`)
        })
    })

    it('clears last search engine when removed', function * () {
      yield this.app.client
        .setInputText(urlInput, '.')
        .waitForElementCount(urlBarIcon + '.fa-search', 1)
    })
    it('clears last search engine when searching', function * () {
      yield this.app.client
        .keys(Brave.keys.ENTER)
        .waitForElementCount(urlBarIcon + '.fa-lock', 1)
    })
    it('clears last search engine when loading arbitrary page', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(Brave.server.url('page1.html'))
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(urlBarIcon + '.fa-unlock', 1)
    })
  })

  const tabLoadingTest = function * (value) {
    const coffee = 'coffee'
    yield this.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .keys(coffee)
      .waitForInputText(urlInput, coffee)
      .click('[data-test-id="tab"][data-frame-key="1"]')
      .waitForInputText(urlInput, value)
      .click('[data-test-id="tab"][data-frame-key="2"]')
      .waitForInputText(urlInput, coffee)
  }

  describe('location bar with loaded tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')
      this.page2Url = Brave.server.url('page2.html')
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
        .waitForInputText(urlInput, '')
        .tabByIndex(0)
        .loadUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .newTab()
        .waitForUrl(Brave.newTabUrl)
        .tabByIndex(1)
        .loadUrl(this.page2Url)
        .waitForUrl(this.page2Url)
    })

    it('Retains user input on tab switches', function () {
      tabLoadingTest(this.page1Url)
    })
  })

  describe('location bar with new tabs', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client
        .waitForInputText(urlInput, '')
        .windowByUrl(Brave.browserWindowUrl)
         .newTab()
        .waitForUrl(Brave.newTabUrl)
        .tabByIndex(1)
    })

    it('Retains user input on tab switches', function () {
      tabLoadingTest('')
    })
  })

  describe('Typing fast with newtab does not clear user input', function () {
    Brave.beforeAll(this)

    before(function * () {
      const input = 'brianbondy.com/projects'
      const sites = []
      for (var i = 0; i < 5000; i++) {
        sites.push({ location: 'https://www.brave.com' + i })
      }
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client
        .addSiteList(sites)
        .waitForInputText(urlInput, '')
        .windowByUrl(Brave.browserWindowUrl)
        .newTab()
        .waitForElementFocus(urlInput)
        .keys(input)
        .waitForInputText(urlInput, input)
    })

    it('Retains user input on tab switches', function () {
      tabLoadingTest('')
    })
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
        .waitForInputText(urlInput, '')
        .windowByUrl(Brave.browserWindowUrl)
        .click(reloadButton)
        .activateTitleMode()
    })

    it('reverts the URL', function * () {
      yield this.app.client
        .activateURLMode()
        .waitForInputText(urlInput, this.page1Url)
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
      yield this.app.client
        .waitForInputText(urlInput, this.page2Url)
    })
  })

  describe('keeps url text separate from suffix text', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.waitForExist(urlInput)
      yield this.app.client.waitForElementFocus(urlInput)
      yield this.app.client
        .onClearBrowsingData('browserHistory', true)
        .addSite({ location: 'https://github.com/brave/browser-laptop', title: 'browser-laptop' })
        .addSite({ location: 'https://github.com/brave/ad-block', title: 'Muon' })
    })

    it('changes only the selection', function * () {
      yield this.app.client
        .setInputText(urlInput, 'git')
        .waitForSelectedText('hub.com')
        // Select next suggestion
        .keys(Brave.keys.DOWN)
        .waitForSelectedText('hub.com/brave/browser-laptop')
        // Remove selection of suffix
        .keys(Brave.keys.RIGHT)
        // Move to the left and create a new selection
        .keys(Brave.keys.LEFT)
        .keys(Brave.keys.LEFT)
        .keys(Brave.keys.LEFT)
        .keys(Brave.keys.SHIFT)
        .keys(Brave.keys.LEFT)
        .keys(Brave.keys.SHIFT)
        .keys('s')
        .waitForInputText(urlInput, 'github.com/brave/browser-lastop')
    })
  })
})
