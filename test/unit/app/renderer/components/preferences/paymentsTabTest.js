/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../lib/fakeElectron')
const fakeSettings = require('../../../../lib/fakeSettings')
const {advancedSettingsDialog} = require('../../../../../lib/selectors')

let PaymentsTab
require('../../../../braveUnit')

describe('PaymentsTab component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../../img/toolbar/stoploading_btn.svg')
    mockery.registerMock('../../less/switchControls.less', {})
    mockery.registerMock('../../less/about/preferences.less', {})
    mockery.registerMock('../../less/forms.less', {})
    mockery.registerMock('../../less/button.less', {})
    mockery.registerMock('../../node_modules/font-awesome/css/font-awesome.css', {})
    mockery.registerMock('../../../extensions/brave/img/caret_down_grey.svg', 'caret_down_grey.svg')
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
    mockery.registerMock('../../../../extensions/brave/img/ledger/uphold_logo_small.png')
    mockery.registerMock('../../../../extensions/brave/img/ledger/uphold_logo_medium.png')
    mockery.registerMock('../../../../extensions/brave/img/private_internet_access.png')
    mockery.registerMock('../../../../extensions/brave/img/private_internet_access_2x.png')
    mockery.registerMock('../../../../extensions/brave/img/coinbase_logo.png')
    mockery.registerMock('../../../../extensions/brave/img/android_download.svg')
    mockery.registerMock('../../../../extensions/brave/img/ios_download.svg')
    // Mocks the icon used in payments tab
    mockery.registerMock('../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')
    mockery.registerMock('../../../../../img/toolbar/stoploading_btn.svg')
    mockery.registerMock('../../../../extensions/brave/img/ledger/BAT_captcha_dragicon.png')
    mockery.registerMock('../../../../extensions/brave/img/ledger/BAT_captcha_BG_arrow.png')
    // Mocks the icons used in addFundsDialog and its steps
    mockery.registerMock('../../../../../../extensions/brave/img/ledger/wallet_icon.svg')
    mockery.registerMock('../../../../../../extensions/brave/img/ledger/cryptoIcons/ETH_icon.svg')
    mockery.registerMock('../../../../../../extensions/brave/img/ledger/cryptoIcons/BTC_icon.svg')
    mockery.registerMock('../../../../../../extensions/brave/img/ledger/cryptoIcons/LTC_icon.svg')
    mockery.registerMock('../../../../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')
    // Mock image from addFundsDialogFooter
    mockery.registerMock('../../../../../extensions/brave/img/ledger/uphold_logo_medium.png')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/settings', fakeSettings)
    fakeSettings.mockReturnValue = false
    window.chrome = fakeElectron
    PaymentsTab = require('../../../../../../app/renderer/components/preferences/paymentsTab')
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
      assert.equal(wrapper.find(advancedSettingsDialog).length, 0)
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
      assert.equal(wrapper.find(advancedSettingsDialog).length, 1)
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
      assert.equal(wrapper.find(advancedSettingsDialog).length, 1)
      assert.equal(wrapper.find('[data-test-id="visitSelector"]').node.value, 1)
    })
  })
})
