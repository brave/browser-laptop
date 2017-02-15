/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')
const {isWindows, isDarwin, isLinux} = require('../../../common/lib/platformUtil')
const {SettingsList, SettingCheckbox} = require('../../components/settings')
const WidevineInfo = require('../../components/widevineInfo')
const flash = appConfig.resourceNames.FLASH
const widevine = appConfig.resourceNames.WIDEVINE

class PluginsTab extends ImmutableComponent {
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

  render () {
    const braveWikiLink = 'https://github.com/brave/browser-laptop/wiki'
    return <div>
      <div className='sectionTitle' data-l10n-id='pluginSettings' />
      <SettingsList>
        <SettingCheckbox checked={this.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.flashInstalled} />
        <div className='subtext flashText'>
          {
            isDarwin() || isWindows()
            ? <div>
              <span className='fa fa-info-circle flashInfoIcon' />
              <span data-l10n-id='enableFlashSubtext' />&nbsp;
              <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
                location: appConfig.flash.installUrl
              }, true)} title={appConfig.flash.installUrl}>{'Adobe'}</span>.
            </div>
            : <div>
              <span className='fa fa-info-circle flashInfoIcon' />
              <span data-l10n-id='enableFlashSubtextLinux' />
            </div>
          }
          <div>
            <span className='fa fa-info-circle flashInfoIcon' />
            <span data-l10n-id='flashTroubleshooting' />&nbsp;
            <span className='linkText'
              onClick={aboutActions.newFrame.bind(null, {
                location: `${braveWikiLink}/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues`
              }, true)}
              title={`${braveWikiLink}/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues`}>{'wiki'}</span>.
          </div>
        </div>
      </SettingsList>
      {
        !isLinux()
          ? <div>
            <div className='sectionTitle' data-l10n-id='widevineSection' />
            <SettingsList>
              <WidevineInfo newFrameAction={aboutActions.newFrame} />
              <SettingCheckbox checked={this.props.braveryDefaults.get('widevine')} dataL10nId='enableWidevine' onChange={this.onToggleWidevine} />
            </SettingsList>
          </div>
        : null
      }
    </div>
  }
}

module.exports = PluginsTab
