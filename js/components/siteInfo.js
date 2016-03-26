/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const Dialog = require('./dialog')
const windowActions = require('../actions/windowActions')

class SiteInfo extends ImmutableComponent {
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
  get isHttpseShown () {
    return this.props.siteInfo.get('expandHttpse')
  }
  get redirectedResources () {
    return this.props.frameProps.get('httpsEverywhere')
  }
  get isRedirectingResources () {
    return this.redirectedResources && this.redirectedResources.size > 0
  }
  get partitionNumber () {
    return this.props.frameProps.getIn(['partitionNumber'])
  }
  onToggleTPList (e) {
    windowActions.setSiteInfoVisible(true, !this.isTPListShown)
    e.stopPropagation()
  }
  onToggleBlockedAds (e) {
    windowActions.setSiteInfoVisible(true, undefined, !this.isBlockedAdsShown)
    e.stopPropagation()
  }
  onToggleHttpseList (e) {
    windowActions.setSiteInfoVisible(true, undefined, undefined, !this.isHttpseShown)
    e.stopPropagation()
  }
  render () {
    let secureIcon
    if (this.isSecure && !this.isMixedContent) {
      secureIcon = <li><span
        className={cx({
          fa: true,
          'fa-lock': true,
          extendedValidation: this.isExtendedValidation
        })}/><span data-l10n-id='secureConnection'/></li>
    } else if (this.isMixedContent) {
      secureIcon = <li><span className='fa fa-unlock-alt'/><span data-l10n-id='mixedConnection'/></li>
    } else {
      secureIcon = <li><span className='fa fa-unlock'/><span data-l10n-id='insecureConnection' data-l10n-args={JSON.stringify(l10nArgs)}/></li>
    }

    // Figure out the partition info display
    let l10nArgs = {
      partitionNumber: this.partitionNumber
    }

    let partitionInfo
    if (this.partitionNumber) {
      partitionInfo = <li><span className='fa fa-user'/>
        <span data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id='sessionInfo'/></li>
    }

    return <Dialog onHide={this.props.onHide} className='siteInfo' isClickDismiss>
      <ul onClick={(e) => e.stopPropagation()}>
      {
        secureIcon
      }
      {
        partitionInfo
      }
      {
        this.isBlockingTrackedContent
        ? <li>
          <a onClick={this.onToggleTPList.bind(this)}><span className='fa fa-shield'/>
            <span data-l10n-args={JSON.stringify({blockedTrackingElementsSize: this.blockedByTrackingList.size})}
              data-l10n-id='blockedTrackingElements'/>
          </a>
        </li>
        : null
      }
      {
        this.isTPListShown && this.blockedByTrackingList && this.blockedByTrackingList.size > 0
        ? <li><ul>
        {
          this.blockedByTrackingList.map((site) => <li key={site}>{site}</li>)
        }
        </ul></li>
        : null
      }
      {
        this.isBlockingAds
        ? <li>
          <a onClick={this.onToggleBlockedAds.bind(this)}><span className='fa fa-shield'/>
            <span data-l10n-args={JSON.stringify({blockedAdsSize: this.blockedAds.size})}
              data-l10n-id='blockedAds'/>
          </a>
        </li>
        : null
      }
      {
        this.isBlockingAds && this.isBlockedAdsShown
        ? <li><ul>
        {
          this.blockedAds.map((site) => <li key={site}>{site}</li>)
        }
        </ul></li>
        : null
      }
      {
        this.isRedirectingResources
        ? <li>
          <a onClick={this.onToggleHttpseList.bind(this)}><span className='fa fa-shield'/>
            <span data-l10n-args={JSON.stringify({redirectedResourcesSize: this.redirectedResources.size})}
              data-l10n-id='redirectedResources'/>
          </a>
        </li>
        : null
      }
      {
        this.isRedirectingResources && this.isHttpseShown
        ? <li><ul>
        {
          this.redirectedResources.map((sites, ruleset) =>
            <li key={ruleset}>{[ruleset, JSON.stringify(sites.toJS())].join(': ')}</li>)
        }
        </ul></li>
        : null
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
