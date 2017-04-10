/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Educates users that this is DRM, why it is not great, and that
 * we don't own the code being executed if it is turned on.  Provides
 * more info URL link to learn about DRM and Google's license URL link.
 */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const appConfig = require('../../../js/constants/appConfig')

class WidevineInfo extends ImmutableComponent {
  constructor () {
    super()
    this.onMoreInfo = this.onMoreInfo.bind(this)
    this.onViewLicense = this.onViewLicense.bind(this)
  }
  onMoreInfo () {
    this.props.createTabRequestedAction({
      url: appConfig.widevine.moreInfoUrl
    })
  }
  onViewLicense () {
    this.props.createTabRequestedAction({
      url: appConfig.widevine.licenseUrl
    })
  }
  render () {
    return <div className='widevineInfo'>
      <div className='subtext'>
        <span data-l10n-id='enableWidevineSubtext' />
        <span className='fa fa-info-circle'
          onClick={this.onMoreInfo}
          title={appConfig.widevine.moreInfoUrl}
        />
      </div>
      <div className='subtext'>
        <span data-l10n-id='enableWidevineSubtext2' />
        <span className='fa fa-info-circle'
          onClick={this.onViewLicense}
          title={appConfig.widevine.licenseUrl}
        />
      </div>
    </div>
  }
}

module.exports = WidevineInfo
