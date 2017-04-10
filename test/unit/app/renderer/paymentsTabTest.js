/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const fakeSettings = require('../../lib/fakeSettings')
const {btcToCurrencyString} = require('../../../../app/common/lib/ledgerUtil')
let PaymentsTab, EnabledContent
require('../../braveUnit')

describe('PaymentsTab component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../less/switchControls.less', {})
    mockery.registerMock('../../less/about/preferences.less', {})
    mockery.registerMock('../../less/forms.less', {})
    mockery.registerMock('../../less/button.less', {})
    mockery.registerMock('../../node_modules/font-awesome/css/font-awesome.css', {})
    mockery.registerMock('../../extensions/brave/img/caret_down_grey.svg', 'caret_down_grey.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_general.svg', 'browser_prefs_general.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_search.svg', 'browser_prefs_search.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_tabs.svg', 'browser_prefs_tabs.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_extensions.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_plugins.svg', 'browser_prefs_plugins.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_security.svg', 'browser_prefs_security.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_shields.svg', 'browser_prefs_shields.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_payments.svg', 'browser_prefs_payments.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_sync.svg', 'browser_prefs_sync.svg')
    mockery.registerMock('../../../extensions/brave/img/preferences/browser_prefs_advanced.svg', 'browser_prefs_advanced.svg')
    mockery.registerMock('../../../extensions/brave/img/ledger/icon_settings.svg')
    mockery.registerMock('../../../extensions/brave/img/ledger/icon_history.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/verified_green_icon.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/verified_white_icon.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/icon_remove.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/icon_pin.svg')
    mockery.registerMock('../../../../extensions/brave/img/private_internet_access.png')
    mockery.registerMock('../../../../extensions/brave/img/private_internet_access_2x.png')
    mockery.registerMock('../../../../extensions/brave/img/bitgo.png')
    mockery.registerMock('../../../../extensions/brave/img/bitgo_2x.png')
    mockery.registerMock('../../../../extensions/brave/img/coinbase.png')
    mockery.registerMock('../../../../extensions/brave/img/coinbase_2x.png')
    mockery.registerMock('../../../../extensions/brave/img/coinbase_logo.png')
    mockery.registerMock('../../../../extensions/brave/img/android_download.svg')
    mockery.registerMock('../../../../extensions/brave/img/ios_download.svg')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/settings', fakeSettings)
    fakeSettings.mockReturnValue = false
    window.chrome = fakeElectron
    PaymentsTab = require('../../../../app/renderer/components/preferences/paymentsTab')
    EnabledContent = require('../../../../app/renderer/components/preferences/payment/enabledContent')
  })
  after(function () {
    mockery.disable()
  })

  describe('wallet enabled and disabled state', function () {
    it('renders disabled content by default', function () {
      const wrapper = mount(<PaymentsTab ledgerData={Immutable.Map()} />)
      assert.equal(wrapper.find('[data-test-id="disabledContent"]').length, 1)
    })

    it('renders enabled content when enabled', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          ledgerData={Immutable.Map()}
          showOverlay={function () {}} />
      )
      assert.equal(wrapper.find('[data-test-id="disabledContent"]').length, 0)
      assert.equal(wrapper.find('[data-test-id="walletBar"]').length, 1)
    })
  })

  describe('rendering functions', function () {
    it('renders a paymentsContainer', function () {
      const wrapper = mount(
        <PaymentsTab
          ledgerData={Immutable.Map()}
          showOverlay={function () {}} />
      )
      assert(wrapper.find('[data-test-id="paymentsContainer"]'))
      assert.equal(wrapper.find('[data-test-id="paymentsContainer"]').length, 1)
    })

    it('does not render any dialogs by default', function () {
      const wrapper = mount(
        <PaymentsTab
          ledgerData={Immutable.Map()}
          showOverlay={function () {}} />
      )
      assert.equal(wrapper.find('.dialog').length, 0)
    })

    it('renders the create wallet button by default', function () {
      const wrapper = mount(
        <PaymentsTab
          ledgerData={Immutable.Map()}
          showOverlay={function () {}} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 1)
    })

    it('renders the add funds button when wallet is created', function () {
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true})} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 0)
      assert.equal(wrapper.find('[data-test-id="addFundsTitle"]').length, 1)
    })

    it('renders the creating wallet button when wallet is still being created', function () {
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({creating: true})} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 0)
      assert.equal(wrapper.find('[data-test-id="creatingWallet"]').length, 1)
    })

    it('renders payment history button (requires wallet and reconcileStamp)', function () {
      const transactions = new Immutable.List().push(Immutable.Map({submissionStamp: '1'}))
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, transactions: transactions, reconcileStamp: 1})} />
      )
      assert.equal(wrapper.find('[data-test-id="paymentHistoryButton"]').length, 1)
    })

    it('does not render payment history button when wallet is not created', function () {
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, balance: null})} />
      )
      assert.equal(wrapper.find('[data-test-id="paymentHistoryButton"]').length, 0)
    })

    it('does not render payment history button when reconcileStamp is not set', function () {
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, transactions: {size: 3}})} />
      )
      assert.equal(wrapper.find('[data-test-id="paymentHistoryButton"]').length, 0)
    })
  })

  describe('fundsamount functionality', function () {
    it('does not display if wallet not created', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, balance: null})} />
      )
      const inst = wrapper.instance()
      assert.equal(inst.fundsAmount, null)
    })

    it('handles expected balance', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, balance: 5})} />
      )
      assert.equal(wrapper.find('[data-test-id="fundsAmount"]').length, 1)
    })

    it('renders full balance correctly', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, btc: 10, amount: 10})} />
      )
      const inst = wrapper.instance()
      assert.equal(btcToCurrencyString(10, inst.props.ledgerData), '10.00 USD')
    })

    it('renders partial balance correctly', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <EnabledContent
          ledgerData={Immutable.Map({created: false, btc: 10, amount: 2})} />
      )
      const inst = wrapper.instance()
      assert.equal(btcToCurrencyString(10, inst.props.ledgerData), '2.00 USD')
    })
  })

  describe('advanced ledger settings content', function () {
    it('defaults to an 8 second minimum visit duration', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          advancedSettingsOverlayVisible
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map()} />
      )
      assert.equal(wrapper.find('[data-test-id="advancedSettings"]').length, 1)
      assert.equal(wrapper.find('[data-test-id="durationSelector"]').node.value, 8000)
    })

    it('defaults to 1 minimum publisher visit', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          advancedSettingsOverlayVisible
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map()} />
      )
      assert.equal(wrapper.find('[data-test-id="advancedSettings"]').length, 1)
      assert.equal(wrapper.find('[data-test-id="visitSelector"]').node.value, 1)
    })
  })
})
