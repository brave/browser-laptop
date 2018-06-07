/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const {SettingCheckbox} = require('../common/settings')
const DisabledContent = require('./ads/disabledContent')
const EnabledContent = require('./ads/enabledContent')
const {
  sectionTitleStyles,
  SectionTitleWrapper,
  AboutPageSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

// Constants
const settings = require('../../../../js/constants/settings')

// Utils
const cx = require('../../../../js/lib/classSet')
const getSetting = require('../../../../js/settings').getSetting

// Style
const globalStyles = require('../styles/global')
const {paymentStylesVariables} = require('../styles/payment')
const batIcon = require('../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

class AdsTab extends ImmutableComponent {
  get enabled () {
    return getSetting(settings.ADS_ENABLED, this.props.settings)
  }

  render () {
    return <div className={css(styles.payments)} data-test-id='adsContainer'>
      <SectionTitleWrapper>
        <section className={css(styles.payments__title)}>
          <div className={css(
            gridStyles.row1col1,
            sectionTitleStyles.beta
          )}>
            <img className={css(styles.payments__title__icon_bat)} src={batIcon} />
            <AboutPageSectionTitle>Brave Ads</AboutPageSectionTitle>
            <SectionLabelTitle>beta</SectionLabelTitle>
          </div>

          <div data-test-id='enablePaymentsSwitch' className={css(
            gridStyles.row1col2,
            styles.payments__title__switch
          )}>
            {
              this.enabled
                ? <div>
                  <SettingCheckbox
                    dataL10nIdLeft='off'
                    dataL10nId='on'
                    prefKey={settings.ADS_ENABLED}
                    settings={this.props.settings}
                    onChangeSetting={this.props.onChangeSetting}
                    customStyleTextLeft={[
                      styles.switch__label,
                      styles.switch__label_left,
                      styles.switch__label_left_off
                    ]}
                    customStyleTextRight={[
                      styles.switch__label,
                      styles.switch__label_right
                    ]}
                    className={cx({
                      [css(styles.payments__title__switch__checkbox)]: true
                    })}
                  />
                  <a
                    className={cx({
                      fa: true,
                      'fa-question-circle': true,
                      [css(styles.payments__title__switch__moreInfo)]: true
                    })}
                    href='https://brave.com/Payments_FAQ.html'
                    data-l10n-id='paymentsFAQLink'
                    rel='noopener' target='_blank'
                  />
                </div>
                : null
            }

          </div>
          <div className={css(gridStyles.row1col3)}>
            {
              this.enabled
                ? <SettingCheckbox
                  dataL10nIdLeft='Mode A'
                  dataL10nId='Mode B'
                  prefKey={settings.ADS_OPERATING_MODE}
                  settings={this.props.settings}
                  onChangeSetting={this.props.onChangeSetting}
                  customStyleTextLeft={[
                    styles.switch__label,
                    styles.switch__label_left,
                    styles.switch__label_left_off
                  ]}
                  customStyleTextRight={[
                    styles.switch__label,
                    styles.switch__label_right
                  ]}
                  disabled
                />
                : null
            }
          </div>
        </section>
      </SectionTitleWrapper>
      {
        this.enabled
          ? <EnabledContent
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            siteSettings={this.props.siteSettings}
            demoValue={this.props.demoValue}
            userModelData={this.props.userModelData}
          />
          : <DisabledContent
            userModelData={this.props.userModelData}
          />
      }
    </div>
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
  payments: {
    width: '805px',

    // cf: padding of .prefTabContainer
    paddingBottom: '40px'
  },

  payments__history__header: {
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`
  },

  payments__history__body: {
    height: '300px',
    overflowY: 'auto',
    padding: '0 !important'
  },

  payments__history__footer: {
    display: 'block !important',
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`,
    paddingTop: '10px !important',
    paddingBottom: '10px !important'
  },

  payments__history__title: {
    // TODO: refactor preferences.less to remove !important
    color: `${globalStyles.color.braveMediumOrange} !important`,
    textIndent: '0 !important'
  },

  payments__title: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
    width: '100%'
  },

  payments__title__icon_bat: {
    width: globalStyles.spacing.batIconWidth
  },

  payments__title__switch: {
    display: 'flex',
    alignItems: 'center'
  },

  payments__title__switch__checkbox: {
    display: 'inline-block'
  },

  payments__title__switch__moreInfo: {
    color: globalStyles.color.commonTextColor,
    position: 'relative',
    left: '3px',
    cursor: 'pointer',
    fontSize: globalStyles.payments.fontSize.regular,

    // TODO: refactor preferences.less to remove !important
    ':hover': {
      textDecoration: 'none !important'
    }
  },

  payments__title__actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  payments__title__actions__autoSuggest: {
    fontSize: globalStyles.fontSize.settingItemSubtext,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    top: '1px'
  },

  payments__title__actions__icons: {
    position: 'relative',
    top: '3.5px',

    // See: #11580
    whiteSpace: 'nowrap'
  },

  payments__title__actions__icons__icon: {
    backgroundColor: globalStyles.color.braveOrange,
    width: '25px',
    height: '26px',
    display: 'inline-block',
    position: 'relative',

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },

  payments__title__actions__icons__icon_disabled: {
    backgroundColor: globalStyles.color.chromeTertiary,
    cursor: 'default',

    ':hover': {
      backgroundColor: globalStyles.color.chromeTertiary
    }
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

  payments__deleted__wrapper: {
    maxHeight: '500px',
    borderRadius: 0,
    overflowY: 'scroll'
  },

  recoveryFooter: {
    justifyContent: 'normal'
  }
})

module.exports = AdsTab
