/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../../immutableComponent')
const {AboutPageSectionTitle} = require('../../../common/sectionTitle')
const {GroupedFormTextbox} = require('../../../common/textbox')
const ClipboardButton = require('../../../common/clipboardButton')
const BrowserButton = require('../../../common/browserButton')

// Actions
const appActions = require('../../../../../../js/actions/appActions')

// Styles
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('../../../styles/global')
const ethIcon = require('../../../../../extensions/brave/img/ledger/cryptoIcons/ETH_icon.svg')
const btcIcon = require('../../../../../extensions/brave/img/ledger/cryptoIcons/BTC_icon.svg')
const ltcIcon = require('../../../../../extensions/brave/img/ledger/cryptoIcons/LTC_icon.svg')
const batIcon = require('../../../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')
const fakeQRCode = require('../../../../../extensions/brave/img/ledger/fakeQRCode.png')

class AddFundsDialog extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onCopy = this.onCopy.bind(this)
  }

  get batWelcomeScreen () {
    return (
      <div data-test-id='batWelcomeScreen'>
        <AboutPageSectionTitle canWrap data-l10n-id='helloBat' />
        <p data-l10n-id='helloBatText1'
          className={css(styles.addFundsDialog__main__text)}
        />
        <p data-l10n-id='helloBatText2'
          className={css(styles.addFundsDialog__main__text)}
        />
      </div>
    )
  }

  get batContribMatching () {
    return (
      <div data-test-id='batContribWatching'
        className={css(styles.addFundsDialog__inherit)}
      >
        <div>
          <AboutPageSectionTitle canWrap data-l10n-id='batContributionTitle' />
          <p data-l10n-id='batContributionText1'
            className={css(styles.addFundsDialog__main__text)}
          />
          <p data-l10n-id='batContributionText2'
            className={css(styles.addFundsDialog__main__text)}
          />
        </div>
        <p data-l10n-id='batContributionText3'
          className={css(
            styles.addFundsDialog__main__text,
            styles.addFundsDialog__main__text_small
          )}
        />
      </div>
    )
  }

  get addFundsWizardMain () {
    return (
      <div data-test-id='addFundsWizardMain'
        className={css(styles.addFundsDialog__inherit)}
      >
        <div>
          <header data-l10n-id='addFundsWizardMainHeader' />
          <p data-l10n-id='addFundsWizardMainOptions'
            className={css(
              styles.addFundsDialog__main__text,
              styles.addFundsDialog__main__text_bold
            )}
          />
          <BrowserButton
            groupedItem
            secondaryColor
            custom={[
              styles.currencyIcon,
              styles.ethIcon
            ]}
            onClick={this.something}
          />
          <BrowserButton
            groupedItem
            secondaryColor
            custom={[
              styles.currencyIcon,
              styles.btcIcon
            ]}
            onClick={this.something}
          />
          <BrowserButton
            groupedItem
            secondaryColor
            custom={[
              styles.currencyIcon,
              styles.ltcIcon
            ]}
            onClick={this.something}
          />
          <BrowserButton
            groupedItem
            secondaryColor
            custom={[
              styles.currencyIcon,
              styles.batIcon
            ]}
            onClick={this.something}
          />
        </div>
        <p>
          <span data-l10n-id='addFundsWizardMainReminder'
            className={css(styles.addFundsDialog__main__text_small)}
          />&nbsp;
          <a data-l10n-id='theFAQ'
            className={css(styles.addFundsDialog__main__text_small)}
            href='https://brave.com/faq-payments/#brave-payments'
            target='_blank'
            rel='noopener'
          />
        </p>
      </div>
    )
  }

  onCopy (e) {
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

  get addFundsWizardAddress () {
    return (
      <div>
        <header data-l10n-id='addFundsWizardAddressHeader' />
        <div className={css(styles.addFundsWizardAddress)}>
          <main className={css(styles.addFundsWizardAddress__address)}>
            <GroupedFormTextbox type='text'
              inputRef={(node) => { this.addressInputNode = node }}
              value='NEJC VALUE GOES HERE'
              placeholder='NEJC ADD PLACEHOLDER HERE'
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
              className={css(styles.addFundsWizardAddress__qrCode__text)}
            />
            <img src={fakeQRCode}
              className={css(styles.addFundsWizardAddress__qrCode__image)}
            />
          </aside>
        </div>
        <footer data-l10n-id='addFundsWizardAddressNote'
          className={css(styles.addFundsDialog__main__text_small)}
        />
      </div>
    )
  }

  render () {
    return (
      <section data-test-id='addFundsDialog' className={css(styles.addFundsDialog)}>
        {
          // in order:
          // this.batWelcomeScreen
          // this.batContribMatching
          // this.addFundsWizardMain
          this.addFundsWizardAddress
        }
      </section>
    )
  }
}

const styles = StyleSheet.create({
  addFundsDialog: {
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
      backgroundImage: `url(${batIcon})`,
      backgroundRepeat: 'no-repeat',
      width: '40px',
      height: '40px'
    }
  },

  // JSX needs a wrapper element to work so this
  // would break layout. In this case inherit props
  // from parent.
  addFundsDialog__inherit: {
    display: 'inherit',
    flex: 'inherit',
    justifyContent: 'inherit',
    flexDirection: 'inherit',
    minHeight: 'inherit'
  },

  addFundsDialog__main__text: {
    margin: '20px 0'
  },

  addFundsDialog__main__text_bold: {
    fontWeight: 600
  },

  addFundsDialog__main__text_small: {
    fontSize: 'small'
  },

  // but this inside a pseudo-state
  // otherwise you can't have a gradient background
  currencyIcon: {
    // per spec spacement between buttons is larger
    // than our groupedItem version. sorry Suguru :P
    // margin: '0px 10px 0 0',
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
  },

  addFundsWizardAddress: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    margin: '30px 0'
  },

  addFundsWizardAddress__address: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  addFundsWizardAddress__fancyDivider: {
    display: 'flex',
    width: '40px',
    height: '100%',
    whiteSpace: 'nowrap',
    margin: '0 30px',
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
    maxWidth: '150px'
  }
})

module.exports = AddFundsDialog
