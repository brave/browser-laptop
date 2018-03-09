/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const {BatWelcomeScreen, BatContribMatching} = require('./steps/addFundsBatScreen')
const AddFundsWizardMain = require('./steps/addFundsWizardMain')
const AddFundsWizardAddress = require('./steps/addFundsWizardAddress')

class AddFundsDialog extends React.Component {
  get currentPage () {
    return this.props.addFundsDialog.get('currentPage')
  }

  get currency () {
    return this.props.addFundsDialog.get('currency')
  }

  get currencyQRCode () {
    const walletQR = this.props.walletQR

    if (walletQR != null) {
      return walletQR.get(this.currency)
    }
  }

  get currencyAddress () {
    const addresses = this.props.addresses

    if (addresses != null) {
      return addresses.get(this.currency)
    }
  }

  get currentView () {
    switch (this.currentPage) {
      case 'batContribMatching':
        return <BatContribMatching />
      case 'addFundsWizardMain':
        return <AddFundsWizardMain
          buyForm={this.props.buyForm}
        />
      case 'addFundsWizardAddress':
        return (
          <AddFundsWizardAddress
            funds={this.props.funds}
            minAmount={this.props.minAmount}
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
