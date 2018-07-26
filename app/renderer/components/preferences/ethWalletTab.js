/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const batIcon = require('../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

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

  getDisabledContent () {
    const styles = disabledContentStyles
    return <div className={css(styles.disabledContent__wrapper)} data-test-id='ethwalletWrapper'>
      <div className={css(styles.disabledContent__message)} data-test-id='ethwalletMessage'>
        Some text goes here
      </div>
      <div className={css(styles.disabledContent__footer)}>
        <div className={css(styles.disabledContent__commonText)} data-l10n-id='ethWalletText1' />
      </div>
    </div>
  }

  render () {
    const iframe = this.isEnabled() ? <iframe src={`chrome-extension://${config.ethwalletExtensionId}/index.html`} className={css(styles.frame)} /> : null
    const disabledContent = this.isEnabled() ? null : this.getDisabledContent()
    return <section>
      <SectionTitleWrapper>
        <div className={css(styles.frameWrapper)}>
          {iframe}
        </div>
        <section className={css(styles.ethWallet__title)}>
          { /* Note: This div cannot be replaced with SectionTitleLabelWrapper */ }
          <div className={css(
            gridStyles.row1col1,
            sectionTitleStyles.beta
          )}>
            <img className={css(styles.ethWallet__title__icon_bat)} src={batIcon} />
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
      </SectionTitleWrapper>
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
    width: '100%',
    zIndex: 200
  },

  ethWallet__title__icon_bat: {
    width: globalStyles.spacing.batIconWidth
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

  frame: {
    border: 0,
    width: '100%',
    height: '100%'
  },

  frameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  }
})

const disabledContentStyles = StyleSheet.create({
  disabledContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: globalStyles.spacing.panelMargin
  },

  disabledContent__commonText: {
    padding: '0.5em 0'
  },

  disabledContent__commonText_bold: {
    fontWeight: 'bold'
  },

  disabledContent__wrapper: {
    fontSize: globalStyles.payments.fontSize.regular,
    color: globalStyles.color.mediumGray
  },

  disabledContent__message: {
    backgroundColor: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    boxSizing: 'border-box',
    padding: '40px',
    lineHeight: '1.8em'
  },

  disabledContent__message__header: {
    fontSize: '18px',
    paddingBottom: '0.5em'
  },

  disabledContent__footer: {
    lineHeight: '1.2em',
    padding: '20px'
  }
})

module.exports = EthWalletTab
