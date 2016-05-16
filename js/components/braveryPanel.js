/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const windowActions = require('../actions/windowActions')

class BraveryPanel extends ImmutableComponent {
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
    return this.props.braveryPanelDetail.get('expandTrackingProtection')
  }
  get blockedAds () {
    return this.props.frameProps.getIn(['adblock', 'blocked'])
  }
  get isBlockingAds () {
    return this.blockedAds && this.blockedAds.size > 0
  }
  get isBlockedAdsShown () {
    return this.props.braveryPanelDetail.get('expandAdblock')
  }
  get isHttpseShown () {
    return this.props.braveryPanelDetail.get('expandHttpse')
  }
  get redirectedResources () {
    return this.props.frameProps.get('httpsEverywhere')
  }
  get isRedirectingResources () {
    return this.redirectedResources && this.redirectedResources.size > 0
  }
  onToggleTPList (e) {
    windowActions.setBraveryPanelDetail({
      expandTrackingProtection: !this.isTPListShown
    })
    e.stopPropagation()
  }
  onToggleBlockedAds (e) {
    windowActions.setBraveryPanelDetail({
      expandAdblock: !this.isBlockedAdsShown
    })
    e.stopPropagation()
  }
  onToggleHttpseList (e) {
    windowActions.setBraveryPanelDetail({
      expandHttpse: !this.isHttpseShown
    })
    e.stopPropagation()
  }
  render () {
    return <Dialog onHide={this.props.onHide} className='braveryPanel' isClickDismiss>
      <ul onClick={(e) => e.stopPropagation()}>
      {
        this.isBlockingTrackedContent
        ? <li>
          <a onClick={this.onToggleTPList.bind(this)}><span className='fa fa-shield' />
            <span data-l10n-args={JSON.stringify({blockedTrackingElementsSize: this.blockedByTrackingList.size})}
              data-l10n-id='blockedTrackingElements' />
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
          <a onClick={this.onToggleBlockedAds.bind(this)}><span className='fa fa-shield' />
            <span data-l10n-args={JSON.stringify({blockedAdsSize: this.blockedAds.size})}
              data-l10n-id='blockedAds' />
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
          <a onClick={this.onToggleHttpseList.bind(this)}><span className='fa fa-shield' />
            <span data-l10n-args={JSON.stringify({redirectedResourcesSize: this.redirectedResources.size})}
              data-l10n-id='redirectedResources' />
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

module.exports = BraveryPanel
