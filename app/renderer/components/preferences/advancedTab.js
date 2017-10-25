/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')

// Actions
const {getSetting} = require('../../../../js/settings')

// Components
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')
const {SettingDropdown} = require('../common/dropdown')
const {DefaultSectionTitle} = require('../common/sectionTitle')

// Constants
const settings = require('../../../../js/constants/settings')
const {scaleSize} = require('../../../common/constants/toolbarUserInterfaceScale')

// Utils
const {changeSetting} = require('../../lib/settingsUtil')
const platformUtil = require('../../../common/lib/platformUtil')
const isDarwin = platformUtil.isDarwin()

class AdvancedTab extends ImmutableComponent {
  get swipeNavigationDistanceSetting () {
    if (isDarwin) {
      return <div>
        <DefaultSectionTitle data-l10n-id='swipeNavigationDistance' />
        <SettingsList listClassName={css(styles.swipeNavigation)}>
          <span data-l10n-id='short' className={css(styles.swipeNavigation__shortLabel)} />
          <input type='range' min='1' max='201' step='50' list='swipeDistance'
            value={getSetting(settings.SWIPE_NAV_DISTANCE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.SWIPE_NAV_DISTANCE)} />
          <datalist id='swipeDistance'>
            <option value='1' />
            <option value='51' />
            <option value='101' />
            <option value='151' />
            <option value='201' />
          </datalist>
          <span data-l10n-id='long' className={css(styles.swipeNavigation__longLabel)} />
        </SettingsList>
      </div>
    }

    return null
  }

  render () {
    return <section>
      <main className={css(styles.advancedTabMain)}>
        <DefaultSectionTitle data-l10n-id='contentSettings' />
        <SettingsList>
          <SettingCheckbox dataL10nId='useHardwareAcceleration' prefKey={settings.HARDWARE_ACCELERATION_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          <SettingCheckbox dataL10nId='useSmoothScroll' prefKey={settings.SMOOTH_SCROLL_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          <SettingCheckbox dataL10nId='sendCrashReports' prefKey={settings.SEND_CRASH_REPORTS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          <SettingCheckbox dataL10nId='sendUsageStatistics' prefKey={settings.SEND_USAGE_STATISTICS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingsList>

        <DefaultSectionTitle data-l10n-id='toolbarUserInterfaceScale' />
        <SettingsList>
          <SettingItem>
            <SettingDropdown
              value={getSetting(settings.TOOLBAR_UI_SCALE, this.props.settings)}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TOOLBAR_UI_SCALE)}>
              data-type='float'>
              <option data-l10n-id='scaleSizeSmaller' value={scaleSize.SMALLER} />
              <option data-l10n-id='scaleSizeNormal' value={scaleSize.NORMAL} />
              <option data-l10n-id='scaleSizeLarger' value={scaleSize.LARGER} />
              <option data-l10n-id='scaleSizeSuper' value={scaleSize.SUPERSIZE} />
            </SettingDropdown>
          </SettingItem>
        </SettingsList>

        {this.swipeNavigationDistanceSetting}

        <DefaultSectionTitle data-l10n-id='urlBarOptions' />
        <SettingsList>
          <SettingCheckbox dataL10nId='disableTitleMode' prefKey={settings.DISABLE_TITLE_MODE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          <SettingCheckbox dataL10nId='wideURLbar' prefKey={settings.WIDE_URL_BAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingsList>
      </main>
      <footer className={css(styles.moreInfo)}>
        <div data-l10n-id='requiresRestart' className={css(commonStyles.requiresRestart)} />
      </footer>
    </section>
  }
}

const styles = StyleSheet.create({
  advancedTabMain: {
    paddingBottom: '40px'
  },

  swipeNavigation: {
    display: 'flex',
    alignItems: 'center'
  },

  swipeNavigation__shortLabel: {
    marginRight: '5px'
  },

  swipeNavigation__longLabel: {
    marginLeft: '5px'
  },

  moreInfo: {
    display: 'flex',
    flex: 1,
    alignItems: 'flex-end'
  }
})

module.exports = AdvancedTab
