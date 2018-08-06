/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const ethereumIcon = require('../../../../img/ethereum/ethereum-logo.svg')
const metamaskIcon = require('../../../../img/ethereum/metamask-logo.svg')

// Components
const {SettingCheckbox} = require('../common/settings')
const {
  sectionTitleStyles,
  SectionTitleWrapper,
  AboutPageSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

const settings = require('../../../../js/constants/settings')
const config = require('../../../../js/constants/config')

class EthWalletTab extends ImmutableComponent {
  constructor () {
    super()
    this.onChange = this.onChange.bind(this)
  }

  isEnabled () {
    return this.props.settings.get(settings.ETHWALLET_ENABLED)
  }

  onChange () {
    const {onChangeSetting} = this.props
    if (this.isEnabled()) {
      onChangeSetting(settings.ETHWALLET_ENABLED, false)
    } else {
      onChangeSetting(settings.ETHWALLET_ENABLED, true)
    }
  }

  getIframeContent () {
    return <div className={css(styles.frameContainer)}>
      <iframe src={`chrome-extension://${config.ethwalletExtensionId}/index.html`} className={css(styles.frame)} />
    </div>
  }

  getDisabledContent () {
    const styles = disabledContentStyles
    return <div className={css(styles.disabledContent__wrapper)} data-test-id='ethwalletWrapper'>
      <div className={css(styles.disabledContent)}>
        <div>
          <div className={css(styles.disabledContent__message)} data-test-id='ethwalletMessage'>
            <h1>Create and manage your local Ethereum wallet in Brave</h1>
            <ul className={css(styles.disabledContent__list)}>
              <li className={css(styles.disabledContent__list_item)}>Transfer funds back and forth through the Ethereum blockchain</li>
              <li className={css(styles.disabledContent__list_item)}>Access hardware wallets like the Ledger Nano and Trezor</li>
              <li className={css(styles.disabledContent__list_item)}>Connect your ETH wallet to Metamask for easy DApp transfers</li>
              <li className={css(styles.disabledContent__list_item)}>Transfer ETH to your Brave Wallet for Brave Payments deposits</li>
            </ul>
          </div>
          <div className={css(styles.disabledContent__footer)}>
            <p className={css(styles.disabledContent__note)}>
              <span className={css(styles.disabledContent__note_bold)}>Note:</span>
              <span>If you are using Brave Payments, your anonymous Brave BAT Wallet is <strong>managed separately</strong> from your ETH Wallet.</span>
            </p>
          </div>
        </div>
        <div className={css(styles.disabledContent__sidebar)}>
          <div className={css(styles.disabledContent__sidebar__metamask)}>
            <img className={
              css(
                styles.disabledContent__sidebar__metamask__content,
                styles.disabledContent__sidebar__metamask__content__image
              )
            } src={metamaskIcon} />
            <h2 className={css(
              styles.disabledContent__sidebar__metamask__content,
              styles.disabledContent__sidebar__text
            )}>MetaMask</h2>
          </div>
          <p className={css(styles.disabledContent__sidebar__text)}>Do you use DApps? Try MetaMask with ETH Wallet for additional functionality.</p>
        </div>
      </div>
    </div>
  }

  render () {
    const iframe = this.isEnabled() ? this.getIframeContent() : null
    const disabledContent = this.isEnabled() ? null : this.getDisabledContent()
    return <section>
      <SectionTitleWrapper>
        <div className={css(styles.fullFrame)}>
          {iframe}
          <section className={css(styles.ethWallet__title)}>
            { /* Note: This div cannot be replaced with SectionTitleLabelWrapper */ }
            <div className={css(
              gridStyles.row1col1,
              sectionTitleStyles.beta
            )}>
              <img className={css(styles.ethWallet__title__icon_eth)} src={ethereumIcon} />
              <AboutPageSectionTitle>ETH Wallet</AboutPageSectionTitle>
              <SectionLabelTitle>beta</SectionLabelTitle>
            </div>

            <div data-test-id='enableEthWalletSwitch' className={css(
              gridStyles.row1col2,
              styles.ethWallet__title__switch
            )}>
              <SettingCheckbox
                dataL10nIdLeft='off'
                dataL10nId='on'
                prefKey={settings.ETHWALLET_ENABLED}
                checked={this.isEnabled()}
                onChangeSetting={this.onChange}
                customStyleTextLeft={[
                  styles.switch__label,
                  styles.switch__label_left,
                  styles.switch__label_left_off
                ]}
                customStyleTextRight={[
                  styles.switch__label,
                  styles.switch__label_right
                ]}
              />
            </div>
          </section>
        </div>
      </SectionTitleWrapper>
      <div className={css(disabledContent ? styles.fullFrame : null, disabledContentStyles.disabledContent__background)} />
      {disabledContent}
    </section>
  }
}

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1,

    // Ensure the spacing between switch__label on a small viewport
    paddingRight: globalStyles.spacing.panelPadding
  },

  row1col2: {
    gridRow: 1,
    gridColumn: 2
  },

  row1col3: {
    gridRow: 1,
    gridColumn: 3
  }
})

const styles = StyleSheet.create({
  ethWallet: {
    width: '805px',

    // cf: padding of .prefTabContainer
    paddingBottom: '40px'
  },

  ethWallet__title: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    margin: '40px'
  },

  ethWallet__title__icon_eth: {
    width: '40px',
    height: '40px'
  },

  ethWallet__title__switch: {
    display: 'flex',
    alignItems: 'center'
  },

  switch__switchControl: {
    padding: 0
  },

  switch__label: {
    fontWeight: 'bold',
    color: globalStyles.color.braveOrange
  },

  switch__label_left: {
    paddingRight: '.75ch'
  },

  switch__label_left_off: {
    color: '#999'
  },

  switch__label_right: {
    // TODO: Add 'position: relative' and 'bottom: 1px' for macOS (en_US) only.
    paddingLeft: '.75ch',
    color: globalStyles.color.braveOrange
  },

  frameContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    overflow: 'hidden'
  },

  frame: {
    border: 0,
    flex: 1
  },

  fullFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  }
})

const disabledContentStyles = StyleSheet.create({
  disabledContent: {
    display: 'flex',
    marginTop: globalStyles.spacing.panelMargin,
    width: 1000,
    paddingBottom: 40
  },

  disabledContent__note: {
    color: globalStyles.color.mediumGray,
    fontSize: '16px'
  },

  disabledContent__note_bold: {
    fontWeight: 'bold',
    color: globalStyles.color.braveOrange,
    paddingRight: '0.3em'
  },

  disabledContent__wrapper: {
    marginTop: '5em',
    fontSize: globalStyles.payments.fontSize.regular,
    color: globalStyles.color.mediumGray
  },

  disabledContent__message: {
    backgroundColor: globalStyles.color.white100,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.8em',
    boxShadow: globalStyles.shadow.softBoxShadow
  },

  disabledContent__list: {
    listStyle: 'none',
    marginTop: '1em'
  },

  disabledContent__list_item: {
    color: globalStyles.color.mediumGray,
    ':before': {
      content: '\'-\'',
      paddingRight: '16px',
      color: globalStyles.color.braveOrange
    }
  },

  disabledContent__message__header: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  disabledContent__footer: {
    marginTop: '2em',
    backgroundColor: globalStyles.color.white100,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    paddingTop: '20px',
    paddingBottom: '20px',
    lineHeight: '1.8em',
    borderWidth: '1px',
    borderColor: globalStyles.color.braveOrange,
    borderStyle: 'solid'
  },

  disabledContent__sidebar: {
    minWidth: '200px',
    marginLeft: '35px',
    marginTop: '40px'
  },

  disabledContent__sidebar__text: {
    color: globalStyles.color.darkGray
  },

  disabledContent__sidebar__metamask: {
    marginBottom: '15px'
  },
  disabledContent__sidebar__metamask__content: {
    display: 'inline-block',
    verticalAlign: 'middle'
  },
  disabledContent__sidebar__metamask__content__image: {
    marginRight: '15px'
  },

  disabledContent__background: {
    backgroundImage: `url(${ethereumIcon})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top center',
    zIndex: '-100',
    opacity: '0.3',
    top: '15em'
  }
})

module.exports = EthWalletTab
