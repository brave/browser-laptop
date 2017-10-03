/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const BrowserButton = require('../../../../common/browserButton')

// Actions
const appActions = require('../../../../../../../js/actions/appActions')

// Styles
const {StyleSheet, css} = require('aphrodite')
const {addFundsDialogMinHeight} = require('../../../../styles/global').spacing
const walletIcon = require('../../../../../../extensions/brave/img/ledger/wallet_icon.svg')
const ethIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/ETH_icon.svg')
const btcIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/BTC_icon.svg')
const ltcIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/LTC_icon.svg')
const batIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

class AddFundsWizardMain extends React.Component {
  constructor (props) {
    super(props)
    this.onClickETH = this.onClickETH.bind(this)
    this.onClickBTC = this.onClickBTC.bind(this)
    this.onClickLTC = this.onClickLTC.bind(this)
    this.onClickBAT = this.onClickBAT.bind(this)
  }

  onClickETH () {
    appActions.onChangeAddFundsDialogStep('addFundsWizardAddress', 'ETH')
  }

  onClickBTC () {
    appActions.onChangeAddFundsDialogStep('addFundsWizardAddress', 'BTC')
  }

  onClickLTC () {
    appActions.onChangeAddFundsDialogStep('addFundsWizardAddress', 'LTC')
  }

  onClickBAT () {
    appActions.onChangeAddFundsDialogStep('addFundsWizardAddress', 'BAT')
  }

  render () {
    return (
      <div data-test-id='addFundsWizardMain'
        className={css(styles.wizardMain)}>
        <div>
          <header data-l10n-id='addFundsWizardMainHeader' />
          <p data-l10n-id='addFundsWizardMainOptions'
            className={css(
              styles.wizardMain__text,
              styles.wizardMain__text_bold
            )}
          />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickETH}
            custom={[
              styles.wizardMain__currencyIcon,
              styles.wizardMain__currencyIcon_eth
            ]} />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickBTC}
            custom={[
              styles.wizardMain__currencyIcon,
              styles.wizardMain__currencyIcon_btc
            ]} />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickLTC}
            custom={[
              styles.wizardMain__currencyIcon,
              styles.wizardMain__currencyIcon_ltc
            ]} />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickBAT}
            custom={[
              styles.wizardMain__currencyIcon,
              styles.wizardMain__currencyIcon_bat
            ]} />
        </div>
        <p>
          <span data-l10n-id='addFundsWizardMainReminder'
            className={css(styles.wizardMain__text_small)}
          />&nbsp;
          <a data-l10n-id='theFAQ'
            className={css(styles.wizardMain__text_small)}
            href='https://brave.com/faq-payments/#brave-payments'
            target='_blank'
            rel='noreferrer noopener'
          />
        </p>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  wizardMain: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: '60px',
    minHeight: addFundsDialogMinHeight,

    '::before': {
      position: 'absolute',
      top: 0,
      left: 0,
      content: '""',
      backgroundRepeat: 'no-repeat',
      backgroundImage: `url(${walletIcon})`,
      backgroundSize: 'contain',
      width: '40px',
      height: '40px'
    }
  },

  wizardMain__text: {
    margin: '20px 0'
  },

  wizardMain__text_bold: {
    fontWeight: 600
  },

  wizardMain__text_small: {
    fontSize: 'small'
  },

  // but this inside a pseudo-state
  // otherwise you can't have a gradient background
  wizardMain__currencyIcon: {
    position: 'relative',
    width: '100px',
    height: '80px',

    // our icon relies here
    '::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      margin: 'auto',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'contain',
      width: '70%',
      height: '70%'
    },

    // here's the currency abbr
    // 'content' is defined per icon
    '::after': {
      position: 'absolute',
      right: 0,
      top: 0,
      margin: '5px',
      fontWeight: 600,
      textTransform: 'uppercase',
      fontSize: 'xx-small'
    }
  },

  wizardMain__currencyIcon_eth: {
    '::before': {
      backgroundImage: `url(${ethIcon})`
    },

    '::after': {
      content: '"eth"'
    }
  },

  wizardMain__currencyIcon_btc: {
    '::before': {
      backgroundImage: `url(${btcIcon})`
    },

    '::after': {
      content: '"btc"'
    }
  },

  wizardMain__currencyIcon_ltc: {
    '::before': {
      backgroundImage: `url(${ltcIcon})`
    },

    '::after': {
      content: '"ltc"'
    }
  },

  wizardMain__currencyIcon_bat: {
    '::before': {
      backgroundImage: `url(${batIcon})`
    },

    '::after': {
      content: '"bat"'
    }
  }
})

module.exports = AddFundsWizardMain
