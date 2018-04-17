/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')
const platformUtil = require('../../../common/lib/platformUtil')
const isDarwin = platformUtil.isDarwin()
const isLinux = platformUtil.isLinux()
const isWindows = platformUtil.isWindows()

const WidevineInfo = require('../main/widevineInfo')
const flash = appConfig.resourceNames.FLASH
const widevine = appConfig.resourceNames.WIDEVINE

const {css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')

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

  onTogglePlugin (plugin, e) {
    switch (plugin) {
      case 'widevine':
        aboutActions.setResourceEnabled(widevine, e.target.value)
        break
      case 'flash':
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
        break
    }
    aboutActions.requireRestart()
  }

  infoCircle (url) {
    return <span className='fa fa-info-circle flashInfoIcon'
      onClick={aboutActions.createTabRequested.bind(null, {
        url
      })} />
  }

  render () {
    const braveWikiLink = 'https://github.com/brave/browser-laptop/wiki'
    const flashInfoLink = `${braveWikiLink}/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues`
    return <div>
      <DefaultSectionTitle data-l10n-id='pluginSettings' />
      <SettingsList>
        <SettingCheckbox checked={this.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.flashInstalled} />
        <div className='subtext flashText'>
          {
            isDarwin || isWindows
            ? <div>
              {this.infoCircle(appConfig.flash.installUrl)}
              <span data-l10n-id='enableFlashSubtext' />&nbsp;
              <span className={css(commonStyles.linkText)} onClick={aboutActions.createTabRequested.bind(null, {
                url: appConfig.flash.installUrl
              })} title={appConfig.flash.installUrl}>{'Adobe'}</span>.
            </div>
            : <div>
              <span className='fa fa-info-circle flashInfoIcon' />
              <span data-l10n-id='enableFlashSubtextLinux' />
            </div>
          }
          <div>
            {this.infoCircle(flashInfoLink)}
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

module.exports = PluginsTab
