/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const BrowserButton = require('../../common/browserButton')
const {SettingsList, SettingItem, SettingCheckbox} = require('../../common/settings')
const {SettingDropdown} = require('../../common/dropdown')
const ImmutableComponent = require('../../immutableComponent')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const appConfig = require('../../../../../js/constants/appConfig')
const settings = require('../../../../../js/constants/settings')

// Utils
const {changeSetting} = require('../../../lib/settingsUtil')
const locale = require('../../../../../js/l10n')

// Style
const commonStyles = require('../../styles/commonStyles')
const globalStyles = require('../../styles/global')

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

  deleteWallet () {
    const confMsg = locale.translation('paymentsDeleteWalletConfirmation')
    if (window.confirm(confMsg)) {
      this.props.hideOverlay('advancedSettings')
      appActions.onWalletDelete()
    }
  }

  render () {
    return <div className={css(styles.footer__wrapper)}>
      <div className={css(styles.footer__wrapper__left)}>
        <BrowserButton groupedItem alertColor
          l10nId='paymentsDeleteWallet'
          testId='paymentsDeleteWallet'
          onClick={this.deleteWallet.bind(this)}
        />
      </div>
      <div>
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
      </div>
    </div>
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
  },

  footer__wrapper: {
    flex: 1,
    display: 'flex'
  },

  footer__wrapper__left: {
    flex: 1
  }
})

module.exports = {
  AdvancedSettingsContent,
  AdvancedSettingsFooter
}
