/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const BrowserButton = require('../../../../common/browserButton')

// Styles
const {StyleSheet, css} = require('aphrodite')
const walletIcon = require('../../../../../../extensions/brave/img/ledger/walletIcon.png')
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
  }

  onClickBTC () {
  }

  onClickLTC () {
  }

  onClickBAT () {
  }

  render () {
    return (
      <div data-test-id='addFundsWizardMain'
        className={css(styles.addFundsWizardMain)}>
        <div>
          <header data-l10n-id='addFundsWizardMainHeader' />
          <p data-l10n-id='addFundsWizardMainOptions'
            className={css(
              styles.addFundsWizardMain__text,
              styles.addFundsWizardMain__text_bold
            )}
          />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickETH}
            custom={[styles.addFundsWizardMain__currencyIcon, styles.ethIcon]}
          />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickBTC}
            custom={[styles.addFundsWizardMain__currencyIcon, styles.btcIcon]}
          />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickLTC}
            custom={[styles.addFundsWizardMain__currencyIcon, styles.ltcIcon]}
            />
          <BrowserButton groupedItem secondaryColor
            onClick={this.onClickBAT}
            custom={[styles.addFundsWizardMain__currencyIcon, styles.batIcon]}
          />
        </div>
        <p>
          <span data-l10n-id='addFundsWizardMainReminder'
            className={css(styles.addFundsWizardMain__text_small)}
          />&nbsp;
          <a data-l10n-id='theFAQ'
            className={css(styles.addFundsWizardMain__text_small)}
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
  addFundsWizardMain: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: '60px',
    minHeight: '250px',

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

  addFundsWizardMain__text: {
    margin: '20px 0'
  },

  addFundsWizardMain__text_bold: {
    fontWeight: 600
  },

  addFundsWizardMain__text_small: {
    fontSize: 'small'
  },

  // but this inside a pseudo-state
  // otherwise you can't have a gradient background
  addFundsWizardMain__currencyIcon: {
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

  ethIcon: {
    '::before': {
      backgroundImage: `url(${ethIcon})`
    },

    '::after': {
      content: '"eth"'
    }
  },

  btcIcon: {
    '::before': {
      backgroundImage: `url(${btcIcon})`
    },

    '::after': {
      content: '"btc"'
    }
  },

  ltcIcon: {
    '::before': {
      backgroundImage: `url(${ltcIcon})`
    },

    '::after': {
      content: '"ltc"'
    }
  },

  batIcon: {
    '::before': {
      backgroundImage: `url(${batIcon})`
    },

    '::after': {
      content: '"bat"'
    }
  }
})

module.exports = AddFundsWizardMain
