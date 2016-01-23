/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const Dialog = require('./dialog')
const WindowActions = require('../actions/windowActions')

class SiteInfo extends ImmutableComponent {
  constructor (props) {
    super(props)
  }
  get isExtendedValidation () {
    return this.props.frameProps.getIn(['security', 'isExtendedValidation'])
  }
  get isSecure () {
    return this.props.frameProps.getIn(['security', 'isSecure'])
  }
  get isBlockingTrackedContent () {
    return this.blockedByTrackingList && this.blockedByTrackingList.size > 0
  }
  get isMixedContent () {
    return this.props.frameProps.getIn(['security', 'isMixedContent'])
  }
  get blockedByTrackingList () {
    return this.props.frameProps.getIn(['trackingProtection', 'blocked'])
  }
  get isTPListShown () {
    return this.props.siteInfo.get('expandTrackingProtection')
  }
  get blockedAds () {
    return this.props.frameProps.getIn(['adblock', 'blocked'])
  }
  get isBlockingAds () {
    return this.blockedAds && this.blockedAds.size > 0
  }
  get isBlockedAdsShown () {
    return this.props.siteInfo.get('expandAdblock')
  }
  get partitionNumber () {
    return this.props.frameProps.getIn(['partitionNumber'])
  }
  onToggleTPList (e) {
    WindowActions.setSiteInfoVisible(true, !this.isTPListShown)
    e.stopPropagation()
  }
  onToggleBlockedAds (e) {
    WindowActions.setSiteInfoVisible(true, undefined, !this.isBlockedAdsShown)
    e.stopPropagation()
  }
  render () {
    let secureIcon
    if (this.isSecure && !this.isMixedContent) {
      secureIcon = <li><span
      className={cx({
        fa: true,
        'fa-lock': true,
        extendedValidation: this.isExtendedValidation})}/><span data-l10n-id='secureConnection'/></li>
    } else if (this.isMixedContent) {
      secureIcon = <li><span className='fa fa-unlock-alt'/><span data-l10n-id='mixedConnection'/></li>
    } else {
      secureIcon = <li><span className='fa fa-unlock'/><span data-l10n-id='insecureConnection' data-l10n-args={JSON.stringify(l10nArgs)}/></li>
    }

    // Figure out the partition info display
    let l10nArgs = {
      partitionNumber: this.partitionNumber
    }
    const l10nId = this.partitionNumber ? 'sessionInfo' : 'defaultSession'
    let partitionInfo = <li><span className='fa fa-user'/>
      <span data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id={l10nId}/></li>

    return <Dialog onHide={this.props.onHide} className='siteInfo' isClickDismiss>
      <ul>
      { secureIcon }
      { partitionInfo }
      { this.isBlockingTrackedContent
        ? <li>
            <a onClick={this.onToggleTPList.bind(this)}><span className='fa fa-shield'/>
            <span data-l10n-args={JSON.stringify({blockedTrackingElementsSize: this.blockedByTrackingList.size})}
              data-l10n-id='blockedTrackingElements'/>
            </a>
          </li> : null
    }
      { this.isTPListShown && this.blockedByTrackingList && this.blockedByTrackingList.size > 0
        ? <li><ul>
        {
          this.blockedByTrackingList.map(site => <li key={site}>{site}</li>)
        }
        </ul></li> : null
      }
      { this.isBlockingAds
        ? <li>
            <a onClick={this.onToggleBlockedAds.bind(this)}><span className='fa fa-shield'/>
              <span data-l10n-args={JSON.stringify({blockedAdsSize: this.blockedAds.size})}
                data-l10n-id='blockedAds'/>
            </a>
          </li> : null
      }
      { this.isBlockingAds && this.isBlockedAdsShown
        ? <li><ul>
        {
          this.blockedAds.map(site => <li key={site}>{site}</li>)
        }
        </ul></li> : null
      }
      </ul>
    </Dialog>
  }
}

SiteInfo.propTypes = {
  frameProps: React.PropTypes.object,
  siteInfo: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = SiteInfo
