/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// util
const {changeSetting} = require('../../../lib/settingsUtil')
const appConfig = require('../../../../../js/constants/appConfig')

// components
const BrowserButton = require('../../common/browserButton')
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
      <div>
        <div className={css(styles.advancedSettings__minimumSetting)} data-l10n-id='minimumPageTimeSetting' />
        <SettingsList>
          <SettingItem>
            <SettingDropdown
              data-test-id='durationSelector'
              defaultValue={minPublisherDuration || appConfig.defaultSettings[settings.PAYMENTS_MINIMUM_VISIT_TIME]}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_MINIMUM_VISIT_TIME)}>
              <option data-l10n-id='minimumPageTimeLow' value='5000' />
              <option data-l10n-id='minimumPageTimeMedium' value='8000' />
              <option data-l10n-id='minimumPageTimeHigh' value='60000' />
            </SettingDropdown>
          </SettingItem>
        </SettingsList>
        <div className={css(styles.advancedSettings__minimumSetting)} data-l10n-id='minimumVisitsSetting' />
        <SettingsList className={css(commonStyles.noMarginBottom)}>
          <SettingItem>
            <SettingDropdown
              data-test-id='visitSelector'
              defaultValue={minPublisherVisits || 1}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_MINIMUM_VISITS)}>
              <option data-l10n-id='minimumVisitsLow' value='1' />
              <option data-l10n-id='minimumVisitsMedium' value='5' />
              <option data-l10n-id='minimumVisitsHigh' value='10' />
            </SettingDropdown>
          </SettingItem>
        </SettingsList>
      </div>
      <div className={css(styles.advancedSettings__switches)}>
        <SettingsList className={css(commonStyles.noMarginBottom)}>
          <SettingCheckbox
            dataTestId='payment-advance-notifications'
            dataL10nId='notifications'
            prefKey={settings.PAYMENTS_NOTIFICATIONS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            className={css(styles.advancedSettings__switches__listItem_first)}
            switchClassName={css(styles.advancedSettings__switches__listItem__checkboxSwitch)}
          />
          <SettingCheckbox
            dataTestId='payment-advance-nonverified'
            dataL10nId='nonVerifiedPublishers'
            prefKey={settings.PAYMENTS_ALLOW_NON_VERIFIED}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            className={css(styles.advancedSettings__switches__listItem_first)}
            switchClassName={css(styles.advancedSettings__switches__listItem__checkboxSwitch)}
          />
          <SettingCheckbox
            dataTestId='payment-advance-video'
            dataL10nId='allowMediaPublishers'
            prefKey={settings.PAYMENTS_ALLOW_MEDIA_PUBLISHERS}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            switchClassName={css(styles.advancedSettings__switches__listItem__checkboxSwitch)}
          />
        </SettingsList>
      </div>
    </section>
  }
}

class AdvancedSettingsFooter extends ImmutableComponent {
  showLedgerBackup () {
    this.props.showOverlay('ledgerBackup')
    this.props.setOverlayName('ledgerBackup')
  }

  showLedgerRecovery () {
    this.props.showOverlay('ledgerRecovery')
    this.props.setOverlayName('ledgerRecovery')
  }

  render () {
    return <section>
      <BrowserButton groupedItem primaryColor
        l10nId='backupLedger'
        testId='backupLedgerButton'
        onClick={this.showLedgerBackup.bind(this)}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='recoverLedger'
        testId='recoverLedgerButton'
        onClick={this.showLedgerRecovery.bind(this)}
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
    display: 'grid',
    gridTemplateColumns: '1fr .75fr',
    gridColumnGap: '32px'
  },

  advancedSettings__minimumSetting: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },

  advancedSettings__switches: {
    display: 'flex',
    alignItems: 'center'
  },

  advancedSettings__switches__listItem_first: {
    marginBottom: '1em'
  },

  advancedSettings__switches__listItem__checkboxSwitch: {
    padding: 0
  }
})

module.exports = {
  AdvancedSettingsContent,
  AdvancedSettingsFooter
}
