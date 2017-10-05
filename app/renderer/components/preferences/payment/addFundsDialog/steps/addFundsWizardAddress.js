/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// Components
const {GroupedFormTextbox} = require('../../../../common/textbox')
const ClipboardButton = require('../../../../common/clipboardButton')

// Actions
const appActions = require('../../../../../../../js/actions/appActions')

// Styles
const globalStyles = require('../../../../styles/global')
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

  get currencyName () {
    switch (this.currency) {
      case 'ETH':
        return 'Ethereum'
      case 'BTC':
        return 'Bitcoin'
      case 'LTC':
        return 'Litecoin'
      // defaults to BAT
      default:
        return this.currency
    }
  }

  get copyToClipboardButton () {
    return (
      <ClipboardButton
        bottomTooltip
        className={globalStyles.appIcons.clipboard}
        copyAction={this.onCopy}
        custom={styles.doneLabel_bottom_addFunds}
      />
    )
  }

  // Input note for BAT is different to avoid repetition
  get footerNote () {
    return this.currency === 'BAT'
      ? 'addFundsWizardAddressFooterBAT'
      : 'addFundsWizardAddressFooter'
  }

  onCopy () {
    if (!this.addressInputNode) {
      return
    }
    appActions.clipboardTextCopied(this.addressInputNode.value)
  }

  componentDidMount () {
    if (!this.addressInputNode) {
      return
    }
    this.addressInputNode.focus()
    this.addressInputNode.select()
  }

  render () {
    return (
      <div
        className={css(
          styles.wizardAddress,
          this.currency === 'ETH' && styles.wizardAddress_eth,
          this.currency === 'BTC' && styles.wizardAddress_btc,
          this.currency === 'LTC' && styles.wizardAddress_ltc,
          this.currency === 'BAT' && styles.wizardAddress_bat
      )}>
        <header data-l10n-id='addFundsWizardAddressHeader'
          data-l10n-args={JSON.stringify({
            currencyName: this.currencyName,
            currency: this.currency
          } || {})}
        />
        <section className={css(styles.wizardAddress__main)}>
          <main className={css(styles.wizardAddress__main__address)}>
            <div className={css(styles.wizardAddress__main__address__textbox)}>
              <GroupedFormTextbox readOnly
                type='text'
                inputRef={(node) => { this.addressInputNode = node }}
                value={this.props.address}
                groupedItem={this.copyToClipboardButton}
                groupedItemTitle='copyToClipboard'
              />
            </div>
            <div className={css(styles.wizardAddress__main__address__fancyDivider)}>
              <span data-l10n-id='or'
                className={css(styles.wizardAddress__main__address__fancyDivider__text)}
              />
            </div>
            <aside className={css(styles.wizardAddress__main__address__qrCode)}>
              <span data-l10n-id='qrCodeVersion'
                className={css(
                  styles.wizardAddress__text,
                  styles.wizardAddress__main__address__qrCode__text
                )} />
              <img src={this.props.qrCode}
                className={css(styles.wizardAddress__main__address__qrCode__image)}
              />
            </aside>
          </main>
          <div className={css(styles.wizardAddress__text)}>
            <p data-l10n-id='addFundsWizardAddressInputNote'
              data-l10n-args={JSON.stringify({
                currency: this.currency,
                funds: this.props.funds
              } || {})}
              className={css(styles.wizardAddress__text__note)}
            />
            <p data-l10n-id={this.footerNote}
              data-l10n-args={JSON.stringify({currency: this.currency} || {})}
              className={css(styles.wizardAddress__text__note)}
            />
          </div>
        </section>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  doneLabel_bottom_addFunds: {
    color: globalStyles.payments.addFunds.info.color,

    // magic number
    right: '25px',
    top: '2rem',

    // See: wizardAddress__text below
    fontSize: 'small'
  },

  wizardAddress: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: '60px',
    minHeight: globalStyles.payments.addFunds.dialog.minHeight,

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

  wizardAddress_bat: {
    '::before': {
      backgroundImage: `url(${batIcon})`
    }
  },

  wizardAddress_eth: {
    '::before': {
      backgroundImage: `url(${ethIcon})`
    }
  },

  wizardAddress_btc: {
    '::before': {
      backgroundImage: `url(${btcIcon})`
    }
  },

  wizardAddress_ltc: {
    '::before': {
      backgroundImage: `url(${ltcIcon})`
    }
  },

  wizardAddress__text: {
    fontSize: 'small'
  },

  wizardAddress__text__note: {
    marginTop: '10px',
    color: globalStyles.payments.addFunds.info.color
  },

  wizardAddress__main: {
    display: 'flex',
    flex: 1,
    flexFlow: 'column nowrap',
    justifyContent: 'space-between',
    margin: '15px 0 0'
  },

  wizardAddress__main__address: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '120px',
    width: '-webkit-fill-available'
  },

  wizardAddress__main__address__textbox: {
    width: '100%'
  },

  wizardAddress__main__address__fancyDivider: {
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

  wizardAddress__main__address__fancyDivider__text: {
    display: 'flex',
    background: '#fff',
    margin: 'auto',
    padding: '8px',
    color: '#000'
  },

  wizardAddress__main__address__qrCode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  wizardAddress__main__address__qrCode__text: {
    color: '#777'
  },

  wizardAddress__main__address__qrCode__image: {
    // magic number
    // TODO: investigate from a viewpoint of l10n
    maxWidth: '120px'
  }
})

module.exports = AddFundsWizardAddress
