/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
let MessageBox, appActions, appStoreRenderer
require('../../../../braveUnit')

const tabId = 1

const detail1 = {
  title: 'An embedded page at brave.com says:',
  message: 'Example message',
  buttons: ['OK', 'Cancel'],
  cancelId: 1,
  suppress: true,
  showSuppress: true
}

let appState = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: [{
    tabId: tabId,
    windowId: 1,
    windowUUID: 'uuid',
    url: 'https://brave.com',
    messageBoxDetail: detail1
  }],
  tabsInternal: {
    index: {
      1: 0
    }
  }
})

const createAppState = detail => Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: [{
    tabId: tabId,
    windowId: 1,
    windowUUID: 'uuid',
    url: 'https://brave.com',
    messageBoxDetail: detail
  }],
  tabsInternal: {
    index: {
      1: 0
    }
  }
})

describe('MessageBox component unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    MessageBox = require('../../../../../../app/renderer/components/common/messageBox')
    appActions = require('../../../../../../js/actions/appActions')
    appStoreRenderer = require('../../../../../../js/stores/appStoreRenderer')
  })

  after(function () {
    mockery.disable()
  })

  describe('Rendering', function () {
    before(function () {
      appStoreRenderer.state = createAppState(detail1)
    })
    it('renders itself inside a dialog component', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      assert.equal(wrapper.find('[data-test-id="messageBoxDialog"]').length, 1)
    })

    it('renders the suppress checkbox if showSuppress is true', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      assert.equal(wrapper.find('[data-test-id="showSuppressSwitch"]').length, 1)
    })

    it('renders the button index 0 as primaryButton', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      assert.equal(wrapper.find('button[data-l10n-id="OK"][data-test-id="primaryColor"]').length, 1)
    })

    it('renders the button index 1 as secondaryButton', function () {
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      assert.equal(wrapper.find('button[data-l10n-id="Cancel"][data-test-id="secondaryColor"]').length, 1)
    })

    it('renders the PromptTextBox when input is allowed', function () {
      appStoreRenderer.state = createAppState(Object.assign({}, detail1, {
        allowInput: true
      }))
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
          allowInput
        />
      )
      assert.equal(wrapper.find('PromptTextBox').length, 1)
    })

    it('hides the suppress checkbox if showSuppress is false', function () {
      const appState2 = appState.setIn(['tabs', 0, 'messageBoxDetail', 'showSuppress'], false)
      appStoreRenderer.state = Immutable.fromJS(appState2)
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      assert.equal(wrapper.find('[data-test-id="showSuppressSwitch"]').length, 0)
    })
  })

  describe('Events', function () {
    before(function () {
      appStoreRenderer.state = Immutable.fromJS(appState)
    })

    it('calls appActions.tabMessageBoxUpdated when SwitchControl is toggled', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxUpdated')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      wrapper.find('[data-test-id="switchBackground"]').simulate('click')
      assert.equal(spy.calledOnce, true)
      appActions.tabMessageBoxUpdated.restore()
    })

    it('calls appActions.tabMessageBoxDismissed with result=true when OK is clicked', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxDismissed')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      const response = {
        suppress: detail1.suppress,
        result: true
      }
      wrapper.find('button[data-l10n-id="OK"][data-test-id="primaryColor"]').simulate('click')
      assert.equal(spy.withArgs(tabId, response).calledOnce, true)
      appActions.tabMessageBoxDismissed.restore()
    })

    it('calls appActions.tabMessageBoxDismissed with result=false when cancel is clicked', function () {
      const spy = sinon.spy(appActions, 'tabMessageBoxDismissed')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      const response = {
        suppress: detail1.suppress,
        result: false
      }
      wrapper.find('button[data-l10n-id="Cancel"][data-test-id="secondaryColor"]').simulate('click')
      assert.equal(spy.withArgs(tabId, response).calledOnce, true)
      appActions.tabMessageBoxDismissed.restore()
    })

    it('calls appActions.tabMessageBoxDismissed with input input is allowed', function () {
      const expectedInput = 'some input'
      appStoreRenderer.state = createAppState(Object.assign({}, detail1, {
        allowInput: true,
        defaultPromptText: expectedInput
      }))
      const spy = sinon.spy(appActions, 'tabMessageBoxDismissed')
      const wrapper = mount(
        <MessageBox
          tabId={tabId}
        />
      )
      const response = {
        suppress: detail1.suppress,
        result: false,
        input: expectedInput
      }
      wrapper.find('button[data-l10n-id="Cancel"][data-test-id="secondaryColor"]').simulate('click')
      assert.equal(spy.withArgs(tabId, response).calledOnce, true)
      appActions.tabMessageBoxDismissed.restore()
    })
  })
})
