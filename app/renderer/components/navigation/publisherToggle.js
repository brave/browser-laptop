/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet} = require('aphrodite')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationButton = require('./buttons/navigationButton')
const FundPublisherIcon = require('../../../../icons/fund_publisher')

// Actions
const appActions = require('../../../../js/actions/appActions')

// State
const tabState = require('../../../common/state/tabState')
const ledgerState = require('../../../common/state/ledgerState')

// Utils
const {getHostPattern, getUrlFromPDFUrl} = require('../../../../js/lib/urlutil')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const ledgerUtil = require('../../../common/lib/ledgerUtil')
const publisherUtil = require('../../../common/lib/publisherUtil')

class PublisherToggle extends React.Component {
  constructor (props) {
    super(props)
    this.onAuthorizePublisher = this.onAuthorizePublisher.bind(this)
  }

  get l10nString () {
    let l10nData = 'disabledPublisher'

    if (!this.props.isVisibleInLedger) {
      l10nData = 'notVisiblePublisher'
    } else if (this.props.isVerifiedPublisher && !this.props.isEnabledForPaymentsPublisher) {
      l10nData = 'verifiedPublisher'
    } else if (this.props.isEnabledForPaymentsPublisher) {
      l10nData = 'enabledPublisher'
    }
    return l10nData
  }

  onAuthorizePublisher () {
    if (this.props.isVisibleInLedger) {
      appActions.changeSiteSetting(this.props.hostPattern, 'ledgerPayments', !this.props.isEnabledForPaymentsPublisher)
    } else {
      appActions.addPublisherToLedger(this.props.location, this.props.tabId)
      appActions.changeSiteSetting(this.props.hostPattern, 'ledgerPayments', true)
    }
  }

  setUpdateTimeout () {
    const shouldSetTimeout = ledgerUtil.hasRequiredVisits(this.props.state, this.props.publisherKey)
    const updateWait = ledgerUtil.getRemainingRequiredTime(this.props.state, this.props.publisherKey)
    if (!shouldSetTimeout) {
      return
    }
    let updateTimeout = setTimeout(() => {
      appActions.onPublisherToggleUpdate(this.props.viewData)
    }, updateWait)
    this.setState({updateTimeout: updateTimeout})
  }

  clearUpdateTimeout () {
    this.state && clearTimeout(this.state.updateTimeout)
  }

  componentDidMount () {
    if (!this.props.isVisibleInLedger) {
      this.setUpdateTimeout()
    }
  }

  componentWillUnmount () {
    this.clearUpdateTimeout()
  }

  componentDidUpdate (prevProps) {
    if (
      !this.props.isVisibleInLedger &&
      (
        prevProps.location !== this.props.location ||
        prevProps.publisherKey !== this.props.publisherKey
      )
    ) {
      this.clearUpdateTimeout()
      this.setUpdateTimeout()
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const tabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const rawLocation = activeFrame.get('location', '')
    const location = getUrlFromPDFUrl(rawLocation)
    const locationId = getBaseUrl(location)
    const publisherKey = ledgerState.getVerifiedPublisherLocation(state, locationId)

    const props = {}
    // used in renderer
    props.state = state
    props.tabId = tabId
    props.location = location
    props.publisherKey = publisherKey
    props.viewData = {location, tabId}
    props.isEnabled = publisherUtil.shouldEnableAddPublisherButton(state, rawLocation, publisherKey)
    props.isVisibleInLedger = ledgerUtil.visibleP(state, publisherKey)
    props.isEnabledForPaymentsPublisher = ledgerUtil.stickyP(state, publisherKey)
    props.isVerifiedPublisher = ledgerState.getPublisherOption(state, publisherKey, 'verified')
    // used in functions
    props.hostPattern = getHostPattern(publisherKey)

    return props
  }

  render () {
    return <NavigationButton
      testId='publisherButton'
      styles={[
        styles.publisherButton,
        this.props.isVisibleInLedger && this.props.isEnabledForPaymentsPublisher && styles.publisherButton_funding
      ]}
      disabled={!this.props.isEnabled}
      l10nId={this.l10nString}
      onClick={this.onAuthorizePublisher}
      dataAttributes={{
        'data-test-authorized': this.props.isEnabledForPaymentsPublisher,
        'data-test-verified': this.props.isVerifiedPublisher
      }}
    >
      <FundPublisherIcon
        isVerified={this.props.isVerifiedPublisher}
        isFunding={this.props.isVisibleInLedger && this.props.isEnabledForPaymentsPublisher}
      />
    </NavigationButton>
  }
}

module.exports = ReduxComponent.connect(PublisherToggle)

const styles = StyleSheet.create({
  publisherButton: {
    // (petemill): The current icon is not very well shaped for centering,
    // especially without verified checkmark, but this padding fixes that.
    padding: '3px 1px 3px 5px'
  },

  publisherButton_funding: {
    '--icon-line-color': 'white'
  }
})
