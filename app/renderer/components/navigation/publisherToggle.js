/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const {NormalizedButton} = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')

// State
const publisherState = require('../../../common/lib/publisherUtil')

// Utils
const {getHostPattern} = require('../../../../js/lib/urlutil')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

const noFundVerifiedPublisherImage = require('../../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
const fundVerifiedPublisherImage = require('../../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
const noFundUnverifiedPublisherImage = require('../../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
const fundUnverifiedPublisherImage = require('../../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')

class PublisherToggle extends React.Component {
  constructor (props) {
    super(props)
    this.onAuthorizePublisher = this.onAuthorizePublisher.bind(this)
  }

  get l10nString () {
    let l10nData = 'disabledPublisher'
    if (this.props.isVerifiedPublisher && !this.props.isEnabledForPaymentsPublisher) {
      l10nData = 'verifiedPublisher'
    } else if (this.props.isEnabledForPaymentsPublisher) {
      l10nData = 'enabledPublisher'
    }
    return l10nData
  }

  onAuthorizePublisher () {
    appActions.changeSiteSetting(this.props.hostPattern, 'ledgerPayments', !this.props.isEnabledForPaymentsPublisher)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const location = activeFrame.get('location', '')
    const locationId = getBaseUrl(location)
    const locationInfo = state.get('locationInfo', Immutable.Map())

    const props = {}
    // used in renderer
    props.isEnabledForPaymentsPublisher = publisherState.enabledForPaymentsPublisher(state, locationId)
    props.isVerifiedPublisher = locationInfo.getIn([locationId, 'verified'])

    // used in functions
    props.publisherId = locationInfo.getIn([locationId, 'publisher'])
    props.hostPattern = getHostPattern(props.publisherId)

    return props
  }

  render () {
    return <NormalizedButton custom={[
      (!this.props.isEnabledForPaymentsPublisher && this.props.isVerifiedPublisher) && styles.publisherToggle_noFundVerified,
      (this.props.isEnabledForPaymentsPublisher && this.props.isVerifiedPublisher) && styles.publisherToggle_fundVerified,
      (!this.props.isEnabledForPaymentsPublisher && !this.props.isVerifiedPublisher) && styles.publisherToggle_noFundUnverified,
      (this.props.isEnabledForPaymentsPublisher && !this.props.isVerifiedPublisher) && styles.publisherToggle_fundUnverified,
      styles.publisherToggle
    ]}
      l10nId={this.l10nString}
      testId='publisherToggle'
      testAuthorized={this.props.isEnabledForPaymentsPublisher}
      testVerified={this.props.isVerifiedPublisher}
      onClick={this.onAuthorizePublisher}
    />
  }
}

const styles = StyleSheet.create({
  publisherToggle: {
    backgroundSize: '18px 18px',
    width: '100%',
    height: '100%'
  },

  publisherToggle_noFundVerified: {
    // 1px added due to the check mark
    background: `url(${noFundVerifiedPublisherImage}) calc(50% + 1px) no-repeat`
  },

  publisherToggle_fundVerified: {
    background: `url(${fundVerifiedPublisherImage}) calc(50% + 1px) no-repeat`
  },

  publisherToggle_noFundUnverified: {
    background: `url(${noFundUnverifiedPublisherImage}) 50% no-repeat`
  },

  publisherToggle_fundUnverified: {
    background: `url(${fundUnverifiedPublisherImage}) 50% no-repeat`
  }
})

module.exports = ReduxComponent.connect(PublisherToggle)
