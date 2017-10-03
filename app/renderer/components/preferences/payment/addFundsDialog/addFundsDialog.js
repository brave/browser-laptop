/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const ImmutableComponent = require('../../../immutableComponent')
const {BatWelcomeScreen, BatContribMatching} = require('./steps/addFundsBatScreen')
const AddFundsWizardMain = require('./steps/addFundsWizardMain')
const AddFundsWizardAddress = require('./steps/addFundsWizardAddress')

// NEJC EXCLUDE ME
const qrCode = require('../../../../../extensions/brave/img/ledger/fakeQRCode.png')
const fakeCurrency = 'eth'
const fakeAddress = 'ETH FOR THE ETH GOD'

class AddFundsDialog extends ImmutableComponent {
  get currency () {
    return fakeCurrency
  }

  get currencyQRCode () {
    return qrCode
  }

  get currencyAddress () {
    return fakeAddress
  }

  render () {
    return (
      <section data-test-id='addFundsDialog'>
        {
          // in order:
          // <BatWelcomeScreen />
          // <BatContribMatching />
          // <AddFundsWizardMain />
          <AddFundsWizardAddress
            currency={this.currency}
            qrCode={this.currencyQRCode}
            address={this.currencyAddress}
          />
        }
      </section>
    )
  }
}

module.exports = AddFundsDialog
