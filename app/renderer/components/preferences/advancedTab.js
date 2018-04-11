/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const Select = require('react-select')
const locale = require('../../../../js/l10n')

// Actions
const {getSetting} = require('../../../../js/settings')
const aboutActions = require('../../../../js/about/aboutActions')

// Components
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')
const {SettingDropdown} = require('../common/dropdown')
const {DefaultSectionTitle} = require('../common/sectionTitle')

// Constants
const settings = require('../../../../js/constants/settings')
const webrtcConstants = require('../../../../js/constants/webrtcConstants')
const {scaleSize} = require('../../../common/constants/toolbarUserInterfaceScale')

// Utils
const {changeSetting} = require('../../lib/settingsUtil')
const platformUtil = require('../../../common/lib/platformUtil')
const isDarwin = platformUtil.isDarwin()
require('../../../../less/react-select.less')

class AdvancedTab extends ImmutableComponent {
  constructor (e) {
    super()
    this.onSpellCheckLangsChange = this.onSpellCheckLangsChange.bind(this)
  }

  onSpellCheckLangsChange (value) {
    if (!value) {
      this.props.onChangeSetting(settings.SPELLCHECK_LANGUAGES, [])
    } else {
      this.props.onChangeSetting(settings.SPELLCHECK_LANGUAGES, value.split(','))
    }
  }

  get spellCheckLanguages () {
    const spellCheckLangOptions = this.props.languageCodes.map(function (lc) {
      return (
        { value: lc, label: locale.translation(lc) }
      )
    })

    return getSetting(settings.SPELLCHECK_ENABLED, this.props.settings)
      ? <SettingItem dataL10nId='spellCheckLanguages'>
        <Select
          name='spellCheckLanguages'
          value={getSetting(settings.SPELLCHECK_LANGUAGES, this.props.settings).join(',')}
          multi='true'
          options={spellCheckLangOptions}
          onChange={this.onSpellCheckLangsChange}
          placeholder={locale.translation('spellCheckLanguages')}
        />
      </SettingItem>
      : null
  }

  get defaultLanguage () {
    return this.props.languageCodes
      .find((lang) => lang.includes(navigator.language)) || 'en-US'
  }

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
          <SettingCheckbox dataL10nId='paymentsAllowPromotions' prefKey={settings.PAYMENTS_ALLOW_PROMOTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
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
        <DefaultSectionTitle data-l10n-id='selectedLanguage' />
        <SettingsList>
          <SettingDropdown
            value={(
              getSetting(settings.LANGUAGE, this.props.settings) ||
              this.defaultLanguage
            )}
            onChange={changeSetting.bind(
              null,
              this.props.onChangeSetting,
              settings.LANGUAGE
            )}>
            {
              this.props.languageCodes
                .map((lc) => <option data-l10n-id={lc} value={lc} />)
            }
          </SettingDropdown>
        </SettingsList>
        <DefaultSectionTitle data-l10n-id='spellcheck' />
        <SettingsList>
          <SettingCheckbox
            dataL10nId='enableSpellCheck'
            prefKey={settings.SPELLCHECK_ENABLED}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />
          {this.spellCheckLanguages}
        </SettingsList>
        <DefaultSectionTitle data-l10n-id='webrtcPolicy' />
        <SettingsList>
          <SettingDropdown
            value={(
              getSetting(settings.WEBRTC_POLICY, this.props.settings)
            )}
            onChange={changeSetting.bind(
              null,
              this.props.onChangeSetting,
              settings.WEBRTC_POLICY
            )}>
            {
              Object.keys(webrtcConstants)
                .map((policy) => <option data-l10n-id={policy} value={webrtcConstants[policy]} />)
            }
          </SettingDropdown>
          <div
            className={css(styles.link)}
            data-l10n-id='webrtcPolicyExplanation'
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'https://cs.chromium.org/chromium/src/content/public/common/webrtc_ip_handling_policy.h'
            })}
          />
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

  link: {
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '3em',
    textDecoration: 'underline'
  },

  moreInfo: {
    display: 'flex',
    flex: 1,
    alignItems: 'flex-end'
  }
})

module.exports = AdvancedTab
