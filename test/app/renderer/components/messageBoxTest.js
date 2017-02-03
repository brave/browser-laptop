/* global describe, beforeEach, it */

const Brave = require('../../../lib/brave')
const {
  urlInput, msgBoxMessage, msgBoxTitle
} = require('../../../lib/selectors')
const assert = require('assert')

const getActiveTabState = (appState) => {
  const tabs = appState.tabs
  const activeTab = tabs.find((tab) => {
    return tab.active
  })
  return activeTab
}

describe('MessageBox component tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForEnabled(urlInput)
  }

  Brave.beforeEach(this)

  let modalAlert
  let alertText

  beforeEach(function * () {
    alertText = undefined
    modalAlert = Brave.server.url('modal_alert.html')

    yield setup(this.app.client)

    yield this.app.client
      .tabByUrl(Brave.newTabUrl)
      .url(modalAlert)
      .waitForUrl(modalAlert)
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

  it('shows the expected alert text', function * () {
    yield this.app.client
      .getText(msgBoxMessage).then((val) => {
        // console.log('expected: ' + alertText + '; actual: ' + val)
        assert(val === alertText)
      })
  })

  it('stores the message box details in the appState', function * () {
    let alertTitle
    let alertMessage

    yield this.app.client
      .getText(msgBoxTitle).then((val) => {
        alertTitle = val
      })
      .getText(msgBoxMessage).then((val) => {
        alertMessage = val
      })
      .getAppState().then((val) => {
        const tabState = getActiveTabState(val.value)
        assert(tabState.messageBoxDetail.title === alertTitle)
        assert(tabState.messageBoxDetail.message === alertMessage)
      })
  })

  it('closes the alert when you press enter', function * () {
    yield this.app.client
      .keys(Brave.keys.ENTER)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          const tabState = getActiveTabState(val.value)
          console.log('tabState=' + JSON.stringify(tabState))
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
          console.log('tabState=' + JSON.stringify(tabState))
          return tabState.messageBoxDetail === undefined
        })
      })
  })

  /*
  TODO:
  - confirm
  - dismiss future ones
  - switching tabs is possible
  - can't click back button
  - can't click forward button
  - can't edit URL in nav bar
  - can't click reload
  - can't click lion

  we also need to handle the following cases and all of them should clear the
  messageBox state for the tab and run the callback with false

  - Closing the browser
  - Closing the window
  - Closing the tab
  - Tab crash
  - Tab navigation
  */
})
