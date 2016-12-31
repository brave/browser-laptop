/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount, shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../lib/fakeElectron')
const fakeSettings = require('../../lib/fakeSettings')
let PaymentsTab
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
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/settings', fakeSettings)
    fakeSettings.mockReturnValue = false
    window.chrome = fakeElectron
    PaymentsTab = require('../../../../app/renderer/components/preferences/paymentsTab')
  })
  after(function () {
    mockery.disable()
  })

  describe('wallet enabled and disabled state', function () {
    it('renders disabled content by default', function () {
      const wrapper = shallow(<PaymentsTab ledgerData={Immutable.Map()} />)
      assert.equal(wrapper.find('.disabledContent').length, 1)
    })

    it('renders enabled content when enabled', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(<PaymentsTab ledgerData={Immutable.Map()} />)
      assert.equal(wrapper.find('.disabledContent').length, 0)
      assert.equal(wrapper.find('.walletBar').length, 1)
    })
  })

  describe('rendering functions', function () {
    it('renders a paymentsContainer', function () {
      const wrapper = shallow(<PaymentsTab ledgerData={Immutable.Map()} />)
      assert(wrapper.find('.paymentsContainer'))
      assert.equal(wrapper.find('.paymentsContainer').length, 1)
    })

    it('does not render any dialogs by default', function () {
      const wrapper = shallow(<PaymentsTab ledgerData={Immutable.Map()} />)
      assert.equal(wrapper.find('.dialog').length, 0)
    })

    it('renders the create wallet button by default', function () {
      const wrapper = shallow(
        <PaymentsTab ledgerData={Immutable.Map()} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 1)
    })

    it('renders the add funds button when wallet is created', function () {
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true})} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 0)
      assert.equal(wrapper.find('[data-test-id="addFundsTitle"]').length, 1)
    })

    it('renders the creating wallet button when wallet is still being created', function () {
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({creating: true})} />
      )
      assert.equal(wrapper.find('[data-test-id="createWallet"]').length, 0)
      assert.equal(wrapper.find('[data-test-id="creatingWallet"]').length, 1)
    })

    it('renders payment history button when there are transactions', function () {
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, transactions: {size: 3}})} />
      )
      assert.equal(wrapper.find('.paymentHistoryButton').length, 1)
    })

    it('does not render payment history button when there are no transactions', function () {
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, transactions: null})} />
      )
      assert.equal(wrapper.find('.paymentHistoryButton').length, 0)
    })
  })

  describe('fundsamount functionality', function () {
    it('does not display if wallet not created', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, balance: null})} />
      )
      const inst = wrapper.instance()
      assert.equal(inst.fundsAmount, null)
    })

    it('handles missing balance', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, balance: null})} />
      )
      assert.equal(wrapper.find('[data-test-id="accountBalanceLoading"]').length, 1)
    })

    it('handles expected balance', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: true, balance: 5})} />
      )
      assert.equal(wrapper.find('[data-test-id="fundsAmount"]').length, 1)
    })

    it('renders full balance correctly', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, btc: 10, amount: 10})} />
      )
      const inst = wrapper.instance()
      assert.equal(inst.btcToCurrencyString(10), '$ 10.00')
    })

    it('renders partial balance correctly', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = shallow(
        <PaymentsTab
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map({created: false, btc: 10, amount: 2})} />
      )
      const inst = wrapper.instance()
      assert.equal(inst.btcToCurrencyString(10), '$ 2.00')
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
      assert.equal(wrapper.find('.advancedSettings').length, 1)
      assert.equal(wrapper.find('[data-test-id="durationSelector"]').node.value, 8000)
    })

    it('defaults to 5 minimum publisher visits', function () {
      fakeSettings.mockReturnValue = true
      const wrapper = mount(
        <PaymentsTab
          advancedSettingsOverlayVisible
          showOverlay={function () {}}
          hideOverlay={function () {}}
          ledgerData={Immutable.Map()} />
      )
      assert.equal(wrapper.find('.advancedSettings').length, 1)
      assert.equal(wrapper.find('[data-test-id="visitSelector"]').node.value, 5)
    })
  })
})
