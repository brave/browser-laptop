/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const {BatWelcomeScreen, BatContribMatching} = require('./steps/addFundsBatScreen')
const AddFundsWizardMain = require('./steps/addFundsWizardMain')
const AddFundsWizardAddress = require('./steps/addFundsWizardAddress')

// NEJC EXCLUDE ME
const qrCode = require('../../../../../extensions/brave/img/ledger/fakeQRCode.png')

class AddFundsDialog extends React.Component {
  get currentPage () {
    return this.props.addFundsDialog.get('currentPage')
  }

  get currency () {
    return this.props.addFundsDialog.get('currency')
  }

  get currencyQRCode () {
    return qrCode
  }

  get currencyAddress () {
    const fakeETH = 'ETH FOR THE ETH GOD'
    const fakeBTC = 'ETH FOR THE BTC GOD'
    const fakeLTC = 'ETH FOR THE ADVENTUROUS'
    const fakeBAT = 'ETH FOR THE BRAVE GOD'

    switch (this.currency) {
      case 'eth':
        return fakeETH
      case 'btc':
        return fakeBTC
      case 'ltc':
        return fakeLTC
      case 'bat':
        return fakeBAT
      default:
        return 'MONEY TALKS'
    }
  }

  get currentView () {
    switch (this.currentPage) {
      case 'batContribMatching':
        return <BatContribMatching />
      case 'addFundsWizardMain':
        return <AddFundsWizardMain />
      case 'addFundsWizardAddress':
        return (
          <AddFundsWizardAddress
            currency={this.currency}
            qrCode={this.currencyQRCode}
            address={this.currencyAddress}
          />
        )
      default:
        return <BatWelcomeScreen />
    }
  }

  render () {
    return (
      <section data-test-id='addFundsDialog'>
        {
          this.currentView
        }
      </section>
    )
  }
}

module.exports = AddFundsDialog
