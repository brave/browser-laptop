/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')
const cx = require('../../../../js/lib/classSet')
const platformUtil = require('../../../common/lib/platformUtil')
const isDarwin = platformUtil.isDarwin()
const isLinux = platformUtil.isLinux()
const isWindows = platformUtil.isWindows()
const locale = require('../../../../js/l10n')

const WidevineInfo = require('../main/widevineInfo')
const flash = appConfig.resourceNames.FLASH
const widevine = appConfig.resourceNames.WIDEVINE

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

const {SettingsList, SettingCheckbox} = require('../common/settings')
const {DefaultSectionTitle} = require('../common/sectionTitle')

class PluginsTab extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onToggleFlash = this.onTogglePlugin.bind(this, 'flash')
    this.onToggleWidevine = this.onTogglePlugin.bind(this, 'widevine')
  }

  get flashInstalled () {
    return getSetting(settings.FLASH_INSTALLED, this.props.settings)
  }
  onToggleFlash (e) {
    aboutActions.setResourceEnabled(flash, e.target.value)
    if (e.target.value !== true) {
      // When flash is disabled, clear flash approvals
      aboutActions.clearSiteSettings('flash', {
        temporary: true
      })
      aboutActions.clearSiteSettings('flash', {
        temporary: false
      })
    }
  }
  onToggleWidevine (e) {
    aboutActions.setResourceEnabled(widevine, e.target.value)
  }
  infoCircle (url, tooltip) {
    let tooltipTranslation = locale.translation(tooltip)
    return <a className={cx({
      fa: true,
      'fa-info-circle': true,
      flashInfoIcon: true,
      [css(styles.plugins__getflash__switch__moreInfo)]: true
    })}
      href={url}
      title={tooltipTranslation}
      rel='noopener' target='_blank' />
  }
  render () {
    const braveWikiLink = 'https://github.com/brave/browser-laptop/wiki'
    const flashInfoLink = `${braveWikiLink}/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues`
    return <div>
      <DefaultSectionTitle data-l10n-id='pluginSettings' />
      <SettingsList>
        <SettingCheckbox checked={this.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.flashInstalled} />
        <div className='subtext flashText'>
          <div>
            {this.infoCircle(appConfig.flash.installUrl, 'flashToolTip')}
            {
              isDarwin || isWindows
              ? (
                <span>
                  <span data-l10n-id='enableFlashSubtext' />&nbsp;
                  <span className={css(commonStyles.linkText)} onClick={aboutActions.createTabRequested.bind(null, {
                    url: appConfig.flash.installUrl
                  })} title={appConfig.flash.installUrl}>{'Adobe'}
                  </span>
                </span>
              )
              : (
                <span data-l10n-id='enableFlashSubtextLinux' />
              )
            }
          </div>
          <div>
            {this.infoCircle(flashInfoLink, 'txFlashToolTip')}
            <span data-l10n-id='flashTroubleshooting' />&nbsp;
            <span className={css(commonStyles.linkText)}
              onClick={aboutActions.createTabRequested.bind(null, {
                url: flashInfoLink,
                active: true
              })}
              title={flashInfoLink}>{'wiki'}</span>.
          </div>
        </div>
      </SettingsList>
      {
        !isLinux
        ? <div>
          <DefaultSectionTitle data-l10n-id='widevineSection' />
          <SettingsList>
            <WidevineInfo createTabRequestedAction={aboutActions.createTabRequested} />
            <SettingCheckbox checked={this.props.braveryDefaults.get('widevine')} dataL10nId='enableWidevine' onChange={this.onToggleWidevine} />
          </SettingsList>
        </div>
      : null
    }
    </div>
  }
}
const styles = StyleSheet.create({
  plugins__getflash__switch__moreInfo: {
    color: globalStyles.color.commonTextColor,
    position: 'relative',
    cursor: 'pointer',
    fontSize: globalStyles.plugins.fontSize.regular,
    ':hover': {
      textDecoration: 'none !important'
    }
  }
})

module.exports = PluginsTab
