/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {notificationBar, titleBar, urlInput, reloadButton} = require('../lib/selectors')
const {autoplayOption} = require('../../app/common/constants/settingsEnums')
const {AUTOPLAY_MEDIA} = require('../../js/constants/settings')
const settings = require('../../js/constants/settings')

describe('notificationBar permissions', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .changeSetting('general.disable-title-mode', false)
  }

  Brave.beforeAll(this)
  before(function * () {
    this.notificationUrl = Brave.server.url('notification.html')
    yield setup(this.app.client)
  })

  beforeEach(function * () {
    yield this.app.client
      .waitForElementCount('.notificationItem', 0)
  })

  it('shows notification bar for geolocation', function * () {
    let notificationUrl = Brave.server.url('geolocation.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('location'))
      }).click('button=Deny')
  })

  describe('Dapps', function () {
    it('shows notification bar for Dapps', function * () {
      let notificationUrl = Brave.server.url('Dapps.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(notificationUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(notificationBar)
        .waitUntil(function () {
          return this.getText(notificationBar).then((val) => {
            return val.includes('Dapp')
          })
        }).click('button=No thanks')
    })

    it('does not show when prompt is dismissed', function * () {
      let notificationUrl = Brave.server.url('Dapps.html')
      yield this.app.client
        .changeSetting(settings.METAMASK_PROMPT_DISMISSED, true)
        .tabByIndex(0)
        .loadUrl(notificationUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(notificationBar, 0)
    })

    it('does not show when MetaMask is enabled', function * () {
      let notificationUrl = Brave.server.url('Dapps.html')
      yield this.app.client
        .changeSetting(settings.METAMASK_ENABLED, true)
        .tabByIndex(0)
        .loadUrl(notificationUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(notificationBar, 0)
    })
  })

  it('can deny permission request', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .element('.notificationItem:nth-Child(1) [data-test-id="notificationOptions"]')
      .click('button=Deny')
      .activateTitleMode()
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('denied'))
      })
  })

  it('does not show the same notification twice', function * () {
    let notificationUrl = Brave.server.url('double-notification.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.notificationItem:nth-child(2)')
      .waitUntil(function () {
        return this.getText('.notificationItem:last-child').then((val) => val.includes('notification'))
      })
      .click('button=Deny')
      .waitForElementCount('.notificationItem', 1)
      .click('button=Deny')
  })

  it('can accept permission request persistently', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitForExist('[data-l10n-id=rememberDecision]')
      .click('[data-l10n-id=rememberDecision]')
      .waitForExist('button=Allow')
      .click('button=Allow')
      .activateTitleMode()
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(Brave.server.url('page1.html'))
    yield this.app.client
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .activateTitleMode()
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
  })
})

describe('notificationBar passwords', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)

  beforeEach(function * () {
    yield this.app.client
      .waitForElementCount('.notificationItem', 0)
  })

  before(function * () {
    this.loginUrl1 = 'https://brave.github.io/brave-tests/https_login/login1.html'
    this.loginUrl2 = 'https://brave.github.io/brave-tests/https_login/login2.html'
    yield setup(this.app.client)
  })

  it('shows notification for login form', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .setValue('#user', 'brave_user')
      .setValue('#password', 'testing')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => {
          return val.includes('brave') && val.includes('brave_user')
        })
      }).click('button=No')
  })

  it('does not include a password in the notification bar', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.loginUrl2)
      .waitForExist('#ChangePassForm')
      .setValue('#password', 'secret')
      .setValue('#old-password', 'secret')
      .setValue('#new-password', 'secret2')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => {
          return val.includes('your password') && !val.includes('secret')
        })
      }).click('button=No')
  })

  it('autofills remembered password on login form', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .setValue('#user', 'brave_user')
      .setValue('#password', 'testing')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('brave') && val.includes('brave_user'))
      }).click('button=Yes')
      .tabByIndex(0)
      .loadUrl('about:passwords')
      .waitForExist('[data-test-id="passwordItem"]')
      .windowByUrl(Brave.browserWindowUrl)
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .click('#acctmgr_loginform')
      .waitForInputText('#user', 'brave_user')
      .waitForInputText('#password', 'testing')
      .tabByIndex(0)
      .loadUrl('about:passwords')
      .waitForExist('[data-test-id="passwordItem"]')
      .click('[data-test-id="passwordAction"]')
      .waitForExist('[data-l10n-id="noPasswordsSaved"]')
  })

  it('autofills remembered password on login page after update password', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .setValue('#user', 'brave_user')
      .setValue('#password', 'testing')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('brave') && val.includes('brave_user'))
      }).click('button=Yes')
      .tabByIndex(0)
      .loadUrl('about:passwords')
      .waitForExist('[data-test-id="passwordItem"]')
      .windowByUrl(Brave.browserWindowUrl)
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .click('#acctmgr_loginform')
      .waitForInputText('#user', 'brave_user')
      .waitForInputText('#password', 'testing')
      .setValue('#password', 'testing2')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('brave') && val.includes('brave_user') && val.includes('update'))
      }).click('button=Yes')
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .click('#acctmgr_loginform')
      .waitForInputText('#user', 'brave_user')
      .waitForInputText('#password', 'testing2')
      .tabByIndex(0)
      .loadUrl('about:passwords')
      .waitForExist('[data-test-id="passwordItem"]')
      .click('[data-test-id="passwordAction"]')
      .waitForExist('[data-l10n-id="noPasswordsSaved"]')
  })

  it('does not show login form notification if user turns it off for the site', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .setValue('#user', 'brave_user')
      .setValue('#password', 'testing')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('brave') && val.includes('brave_user'))
      })
      .click('button=Never for this site')
      .tabByIndex(0)
      .url(this.loginUrl1)
      .waitForExist('#acctmgr_loginform')
      .setValue('#user', 'brave_user')
      .setValue('#password', 'testing')
      .click('#submit')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForElementCount(notificationBar, 0)
  })
})

describe('permissions state', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .changeSetting('general.disable-title-mode', false)
  }

  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
  })

  it('applies old saved permissions', function * () {
    let notificationUrl = Brave.server.url('notificationFail.html')
    yield this.app.client.changeSiteSetting('https?://localhost:*', 'notificationsPermission', false)
    yield this.app.client.tabByIndex(0)
      .loadUrl(notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .activateTitleMode()
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('denied'))
      })
  })
})

describe('Autoplay test', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .changeSetting(AUTOPLAY_MEDIA, autoplayOption.ALWAYS_ASK)
  }

  Brave.beforeEach(this)

  beforeEach(function * () {
    yield setup(this.app.client)
  })

  it('default always ask and block', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
  })

  it('always allow', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .changeSetting('security.autoplay.media', autoplayOption.ALWAYS_ALLOW)
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
  })

  it('allow autoplay until tab closed', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
      .click('button=Yes')
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .activateURLMode()
      .click(reloadButton)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .newTab({ url })
      .waitForTabCount(2)
      .waitForUrl(url)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .closeTabByIndex(0)
      .activateURLMode()
      .click(reloadButton)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
  })

  it('allow autoplay and remember', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
      .click('[data-l10n-id=rememberDecision]')
      .click('button=Yes')
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .activateURLMode()
      .click(reloadButton)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .newTab({ url })
      .waitForTabCount(2)
      .waitForUrl(url)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .closeTabByIndex(0)
      .activateURLMode()
      .click(reloadButton)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === 'Autoplay playing'
          })
      })
  })

  it('keep blocking autoplay', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
      .click('button=No')
      .windowByUrl(Brave.browserWindowUrl)
      .activateURLMode()
      .click(reloadButton)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
  })

  it('keep blocking autoplay and remember', function * () {
    const url = Brave.server.url('autoplay.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('autoplay media'))
      })
      .click('[data-l10n-id=rememberDecision]')
      .click('button=No')
      .windowByUrl(Brave.browserWindowUrl)
      .click(reloadButton)
      .tabByUrl(url)
      .waitUntil(function () {
        return this.getText('div[id="status"]')
          .then((status) => {
            return status === ''
          })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForElementCount('.notificationItem', 0)
  })
})
