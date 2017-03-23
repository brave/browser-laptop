/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// util
const {changeSetting} = require('../../../lib/settingsUtil')

// components
const Button = require('../../../../../js/components/button')
const {SettingsList, SettingItem, SettingCheckbox} = require('../../settings')
const {SettingDropdown} = require('../../dropdown')
const ImmutableComponent = require('../../../../../js/components/immutableComponent')

// style
const commonStyles = require('../../styles/commonStyles')
const globalStyles = require('../../styles/global')
const {paymentCommon} = require('../../styles/payment')

// other
const settings = require('../../../../../js/constants/settings')

class AdvancedSettingsContent extends ImmutableComponent {
  render () {
    const minDuration = this.props.ledgerData.getIn(['synopsisOptions', 'minDuration'])
    const minPublisherVisits = this.props.ledgerData.getIn(['synopsisOptions', 'minPublisherVisits'])

    return <div className={css(paymentCommon.board)}>
      <div className={css(paymentCommon.panel, styles.advancedSettings, commonStyles.noMarginTop, commonStyles.noMarginBottom)} data-test-id='advancedSettings'>
        <div className={css(styles.settingsPanelDivider, styles.deviderFirst)}>
          <div className={css(styles.minimumSetting)} data-l10n-id='minimumPageTimeSetting' />
          <SettingsList>
            <SettingItem>
              <SettingDropdown
                data-test-id='durationSelector'
                defaultValue={minDuration || 8000}
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
              dataL10nId='minimumPercentage'
              prefKey={settings.MINIMUM_PERCENTAGE}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
              className={css(styles.listItem)}
              switchClassName={css(styles.checkboxSwitch)}
              labelClassName={css(commonStyles.noMarginBottom)}
            />
            <SettingCheckbox
              dataL10nId='notifications'
              prefKey={settings.PAYMENTS_NOTIFICATIONS}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
              className={css(styles.listItem, commonStyles.noMarginBottom)}
              switchClassName={css(styles.checkboxSwitch)}
              labelClassName={css(commonStyles.noMarginBottom)}
            />
          </SettingsList>
        </div>
      </div>
    </div>
  }
}

class AdvancedSettingsFooter extends ImmutableComponent {
  render () {
    return <div className={css(paymentCommon.advanceFooter)}>
      <Button l10nId='backupLedger'
        className={css(commonStyles.primaryButton)}
        onClick={this.props.showOverlay.bind(this, 'ledgerBackup')}
      />
      <Button l10nId='recoverLedger'
        className={css(commonStyles.primaryButton, paymentCommon.marginButtons)}
        onClick={this.props.showOverlay.bind(this, 'ledgerRecovery')}
      />
      <Button l10nId='done'
        className={css(commonStyles.whiteButton, commonStyles.inlineButton, paymentCommon.marginButtons)}
        onClick={this.props.hideOverlay.bind(this, 'advancedSettings')}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  advancedSettings: {
    paddingLeft: '50px',
    paddingRight: '50px',
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
