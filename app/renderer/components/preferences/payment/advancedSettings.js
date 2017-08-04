/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// util
const {changeSetting} = require('../../../lib/settingsUtil')
const appConfig = require('../../../../../js/constants/appConfig')

// components
const {BrowserButton} = require('../../common/browserButton')
const {SettingsList, SettingItem, SettingCheckbox} = require('../../common/settings')
const {SettingDropdown} = require('../../common/dropdown')
const ImmutableComponent = require('../../immutableComponent')

// style
const commonStyles = require('../../styles/commonStyles')
const globalStyles = require('../../styles/global')

// other
const settings = require('../../../../../js/constants/settings')

class AdvancedSettingsContent extends ImmutableComponent {
  render () {
    const minPublisherDuration = this.props.ledgerData.getIn(['synopsisOptions', 'minPublisherDuration'])
    const minPublisherVisits = this.props.ledgerData.getIn(['synopsisOptions', 'minPublisherVisits'])

    return <section className={css(styles.advancedSettings)} data-test-id='advancedSettings'>
      <div className={css(styles.settingsPanelDivider)}>
        <div className={css(styles.minimumSetting)} data-l10n-id='minimumPageTimeSetting' />
        <SettingsList>
          <SettingItem>
            <SettingDropdown
              data-test-id='durationSelector'
              defaultValue={minPublisherDuration || appConfig.defaultSettings[settings.MINIMUM_VISIT_TIME]}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISIT_TIME)}>
              <option data-l10n-id='minimumPageTimeLow' value='5000' />
              <option data-l10n-id='minimumPageTimeMedium' value='8000' />
              <option data-l10n-id='minimumPageTimeHigh' value='60000' />
            </SettingDropdown>
          </SettingItem>
        </SettingsList>
        <div className={css(styles.minimumSetting)} data-l10n-id='minimumVisitsSetting' />
        <SettingsList className={css(commonStyles.noMarginBottom)}>
          <SettingItem>
            <SettingDropdown
              data-test-id='visitSelector'
              defaultValue={minPublisherVisits || 1}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISITS)}>
              <option data-l10n-id='minimumVisitsLow' value='1' />
              <option data-l10n-id='minimumVisitsMedium' value='5' />
              <option data-l10n-id='minimumVisitsHigh' value='10' />
            </SettingDropdown>
          </SettingItem>
        </SettingsList>
      </div>
      <div className={css(styles.settingsPanelDivider, styles.lastDivider)}>
        <SettingsList className={css(commonStyles.noMarginBottom)}
          listClassName={css(styles.list)}
        >
          <SettingCheckbox
            dataTestId='payment-advance-notifications'
            dataL10nId='notifications'
            prefKey={settings.PAYMENTS_NOTIFICATIONS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            className={css(styles.listItem)}
            switchClassName={css(styles.checkboxSwitch)}
            labelClassName={css(commonStyles.noMarginBottom)}
          />
          <SettingCheckbox
            dataTestId='payment-advance-nonverified'
            dataL10nId='nonVerifiedPublishers'
            prefKey={settings.PAYMENTS_NON_VERIFIED}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            className={css(styles.listItem, commonStyles.noMarginBottom)}
            switchClassName={css(styles.checkboxSwitch)}
            labelClassName={css(commonStyles.noMarginBottom)}
          />
        </SettingsList>
      </div>
    </section>
  }
}

class AdvancedSettingsFooter extends ImmutableComponent {
  render () {
    return <section>
      <BrowserButton groupedItem primaryColor
        l10nId='backupLedger'
        testId='backupLedgerButton'
        onClick={this.props.showOverlay.bind(this, 'ledgerBackup')}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='recoverLedger'
        testId='recoverLedgerButton'
        onClick={this.props.showOverlay.bind(this, 'ledgerRecovery')}
      />
      <BrowserButton groupedItem secondaryColor
        l10nId='done'
        testId='doneButton'
        onClick={this.props.hideOverlay.bind(this, 'advancedSettings')}
      />
    </section>
  }
}

const styles = StyleSheet.create({
  advancedSettings: {
    display: 'flex',
    flexWrap: 'nowrap'
  },
  settingsPanelDivider: {
    width: '100%'
  },
  minimumSetting: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },
  lastDivider: {
    display: 'flex',
    alignItems: 'center',
    width: 'auto',
    position: 'relative',
    left: '1em'
  },
  list: {
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'space-between'
  },
  listItem: {
    display: 'flex',
    marginBottom: '1em'
  },
  checkboxSwitch: {
    marginTop: '2px',
    paddingTop: 0,
    paddingBottom: 0
  }
})

module.exports = {
  AdvancedSettingsContent,
  AdvancedSettingsFooter
}
