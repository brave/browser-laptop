/* global describe, beforeEach, it */

const Brave = require('../../../lib/brave')
const {
  urlInput, backButton, forwardButton, forwardButtonDisabled,
  msgBoxSuppress, msgBoxSuppressTrue, msgBoxMessage, msgBoxTitle
} = require('../../../lib/selectors')
const assert = require('assert')

const getActiveTabState = (appState) => {
  const tabs = appState.tabs
  const activeTab = tabs.find((tab) => {
    return tab.active
  })
  return activeTab
}

const getBackgroundTabState = (appState) => {
  const tabs = appState.tabs
  const nonActiveTab = tabs.find((tab) => {
    return !tab.active && tab.messageBoxDetail
  })
  return nonActiveTab
}

let modalAlert
let alertText

describe('MessageBox component tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForEnabled(urlInput)
  }

  function * showsExpectedMessage (client) {
    yield client
      .waitForTextValue(msgBoxMessage, alertText)
  }

  function * storesDetailsInTabState (client) {
    let alertTitle
    let alertMessage

    yield client
      .waitForVisible(msgBoxTitle)
      .getText(msgBoxTitle).then((val) => {
        alertTitle = val
      })
      .waitForVisible(msgBoxMessage)
      .getText(msgBoxMessage).then((val) => {
        alertMessage = val
      })
      .getAppState().then((val) => {
        const tabState = getActiveTabState(val.value)
        assert(tabState.messageBoxDetail.title === alertTitle)
        assert(tabState.messageBoxDetail.message === alertMessage)
      })
  }

  Brave.beforeEach(this)

  describe('alert', function () {
    beforeEach(function * () {
      alertText = undefined
      modalAlert = Brave.server.url('modal_alert.html')

      yield setup(this.app.client)

      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .loadUrl(modalAlert)
        .waitForVisible('#trigger')
        .leftClick('#trigger')
        .waitUntil(function () {
          return this.alertText().then((response) => {
            alertText = response
            return response
          }, () => {
            return false
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(msgBoxMessage)
    })

    it('shows the expected message', function * () {
      yield showsExpectedMessage(this.app.client)
    })

    it('stores the message box details in the tabState', function * () {
      yield storesDetailsInTabState(this.app.client)
    })

    it('closes the alert when you press enter', function * () {
      yield this.app.client
        .keys(Brave.keys.ENTER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            const tabState = getActiveTabState(val.value)
            return tabState.messageBoxDetail === undefined
          })
        })
    })

    it('closes the alert when you press escape', function * () {
      yield this.app.client
        .keys(Brave.keys.ESCAPE)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            const tabState = getActiveTabState(val.value)
            return tabState.messageBoxDetail === undefined
          })
        })
    })

    describe('when showing an alerts multiple times', function () {
      beforeEach(function * () {
        yield this.app.client
          .keys(Brave.keys.ENTER)
          .waitUntil(function () {
            return this.getAppState().then((val) => {
              const tabState = getActiveTabState(val.value)
              return tabState.messageBoxDetail === undefined
            })
          })
          // Show modal a 2nd time
          .tabByUrl(modalAlert)
          .leftClick('#trigger')
          .waitUntil(function () {
            return this.alertText().then((response) => {
              alertText = response
              return response
            }, () => {
              return false
            })
          })
          // 2nd time an alert from this source is shown,
          // we display a "suppress" switch
          .windowByUrl(Brave.browserWindowUrl)
      })

      it('shows a suppress switch', function * () {
        yield this.app.client
          .waitForVisible(msgBoxSuppress)
      })

      it('lets you suppress future notifications', function * () {
        yield this.app.client
          // click to set Suppress = true
          .click(msgBoxSuppress)
          .waitForVisible(msgBoxSuppressTrue)
          // Close alert again
          .keys(Brave.keys.ENTER)
          .waitUntil(function () {
            return this.getAppState().then((val) => {
              const tabState = getActiveTabState(val.value)
              return tabState.messageBoxDetail === undefined
            })
          })
          // Try to show modal a 3rd time
          .tabByUrl(modalAlert)
          .leftClick('#trigger')
          .windowByUrl(Brave.browserWindowUrl)
          .pause(2000)
          .waitUntil(function () {
            return this.getAppState().then((val) => {
              const tabState = getActiveTabState(val.value)
              return tabState.messageBoxDetail === undefined
            })
          })
      })
    })

    describe('when opening a new tab (while alert is showing)', function () {
      beforeEach(function * () {
        const page1 = Brave.server.url('page1.html')
        const page2 = Brave.server.url('page2.html')
        // open a new tab
        yield this.app.client
          .newTab({ url: page1 })
          .waitForTabCount(2)

        yield this.app.client
          .waitForVisible('#thelink[href="page2.html"]', 5000)

        // load a basic history for this tab
        yield this.app.client
          .url(page2)
          .waitForVisible('#thelink[href="page1.html"]', 5000)
          .url(page1)
          .waitForVisible('#thelink[href="page2.html"]', 5000)
      })

      it('lets you follow links in the tab', function * () {
        // click link
        yield this.app.client
          .leftClick('#thelink')

        // verify link was followed
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitForTextValue('[data-test-id="tab"][data-test-active-tab="true"] [data-test-id="tabTitle"]', 'Page 2')
      })

      it('lets you use the back button', function * () {
        // click back button
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .leftClick(backButton)

        // verify page is previous
        yield this.app.client
          .waitForTextValue('[data-test-id="tab"][data-test-active-tab="true"] [data-test-id="tabTitle"]', 'Page 2')
      })

      it('lets you use the forward button', function * () {
        // click back button
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .leftClick(backButton)
          .waitForElementCount(forwardButtonDisabled, 0)

        // click forward button
        yield this.app.client
          .leftClick(forwardButton)

        // verify page is previous
        yield this.app.client
          .waitForTextValue('[data-test-id="tab"][data-test-active-tab="true"] [data-test-id="tabTitle"]', 'Page 1')
      })

      it('original tab does not respond to escape or enter being pressed', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .keys(Brave.keys.ENTER)
          .pause(250)
          .keys(Brave.keys.ESCAPE)
          .pause(250)
          .getAppState().then((val) => {
            const detail = getBackgroundTabState(val.value)
            assert(detail)
          })
      })
    })
  })

  describe('confirm', function () {
    beforeEach(function * () {
      alertText = undefined
      modalAlert = Brave.server.url('modal_confirm.html')

      yield setup(this.app.client)

      yield this.app.client
        .tabByUrl(Brave.newTabUrl)
        .loadUrl(modalAlert)
        .waitForVisible('#trigger')
        .leftClick('#trigger')
        .waitUntil(function () {
          return this.alertText().then((response) => {
            alertText = response
            return response
          }, () => {
            return false
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(msgBoxMessage)
    })

    it('shows the expected message', function * () {
      yield showsExpectedMessage(this.app.client)
    })

    it('stores the message box details in the tabState', function * () {
      yield storesDetailsInTabState(this.app.client)
    })
  })
})
