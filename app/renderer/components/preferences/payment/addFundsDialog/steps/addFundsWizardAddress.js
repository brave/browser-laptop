/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Components
const React = require('react')
const {GroupedFormTextbox} = require('../../../../common/textbox')
const ClipboardButton = require('../../../../common/clipboardButton')

// Actions
const appActions = require('../../../../../../../js/actions/appActions')

// Styles
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../../../../styles/global')
const {addFundsDialogMinHeight} = require('../../../../styles/global').spacing
const ethIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/ETH_icon.svg')
const btcIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/BTC_icon.svg')
const ltcIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/LTC_icon.svg')
const batIcon = require('../../../../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

class AddFundsWizardAddress extends React.Component {
  constructor (props) {
    super(props)
    this.onCopy = this.onCopy.bind(this)
  }

  get currency () {
    return this.props.currency
  }

  onCopy () {
    if (!this.addressInputNode) {
      return
    }
    appActions.clipboardTextCopied(this.addressInputNode.value)
  }

  get copyToClipboardButton () {
    return (
      <ClipboardButton
        bottomTooltip
        className={globalStyles.appIcons.clipboard}
        copyAction={this.onCopy}
      />
    )
  }

  render () {
    return (
      <div
        className={css(
          styles.addFundsWizardAddress,
          this.currency === 'eth' && styles.addFundsWizardAddress_eth,
          this.currency === 'btc' && styles.addFundsWizardAddress_btc,
          this.currency === 'ltc' && styles.addFundsWizardAddress_ltc,
          this.currency === 'bat' && styles.addFundsWizardAddress_bat
      )}>
        <header data-l10n-id='addFundsWizardAddressHeader' />
        <div className={css(styles.addFundsWizardAddress__main)}>
          <main className={css(styles.addFundsWizardAddress__inputBox)}>
            <GroupedFormTextbox type='text'
              inputRef={(node) => { this.addressInputNode = node }}
              value={this.props.address}
              placeholder=''
              groupedItem={this.copyToClipboardButton}
              groupedItemTitle='copyToClipboard'
            />
            <div className={css(styles.addFundsWizardAddress__fancyDivider)}>
              <span data-l10n-id='or'
                className={css(styles.addFundsWizardAddress__fancyDivider__text)}
              />
            </div>
          </main>
          <aside className={css(styles.addFundsWizardAddress__qrCode)}>
            <span data-l10n-id='qrCodeVersion'
              className={css(
                styles.addFundsWizardAddress__qrCode__text,
                styles.addFundsWizardAddress__text_small
              )} />
            <img src={this.props.qrCode}
              className={css(styles.addFundsWizardAddress__qrCode__image)}
            />
          </aside>
        </div>
        <footer data-l10n-id='addFundsWizardAddressNote'
          className={css(styles.addFundsWizardAddress__text_small)}
        />
      </div>
    )
  }
}

const styles = StyleSheet.create({
  addFundsWizardAddress: {
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
      backgroundSize: 'contain',
      width: '40px',
      height: '40px'
    }
  },

  addFundsWizardAddress_bat: {
    '::before': {
      backgroundImage: `url(${batIcon})`
    }
  },

  addFundsWizardAddress_eth: {
    '::before': {
      backgroundImage: `url(${ethIcon})`
    }
  },

  addFundsWizardAddress_btc: {
    '::before': {
      backgroundImage: `url(${btcIcon})`
    }
  },

  addFundsWizardAddress_ltc: {
    '::before': {
      backgroundImage: `url(${ltcIcon})`
    }
  },

  addFundsWizardAddress__main: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    margin: '15px 0'
  },

  addFundsWizardAddress__main__text_bold: {
    fontWeight: 600
  },

  addFundsWizardAddress__text_small: {
    fontSize: 'small'
  },

  addFundsWizardAddress__inputBox: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
    height: '120px'
  },

  addFundsWizardAddress__fancyDivider: {
    display: 'flex',
    width: '40px',
    height: '100%',
    whiteSpace: 'nowrap',
    margin: '0 20px',
    // new law: if something can be done in CSS, it will be done in CSS.
    backgroundImage: 'linear-gradient(black 33%, rgba(255,255,255,0) 0%)',
    backgroundPosition: 'center',
    backgroundSize: '2px 6px',
    backgroundRepeat: 'repeat-y'
  },

  addFundsWizardAddress__fancyDivider__text: {
    display: 'flex',
    background: 'white',
    margin: 'auto',
    padding: '8px',
    color: '#000'
  },

  addFundsWizardAddress__qrCode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px 0'
  },

  addFundsWizardAddress__qrCode__text: {
    color: '#777',
    margin: '5px 0'
  },

  addFundsWizardAddress__qrCode__image: {
    maxWidth: '100px'
  }
})

module.exports = AddFundsWizardAddress
