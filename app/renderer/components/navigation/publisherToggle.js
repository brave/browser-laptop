/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')

// Actions
const appActions = require('../../../../js/actions/appActions')

// State
const ledgerState = require('../../../common/state/ledgerState')

// Utils
const {getHostPattern} = require('../../../../js/lib/urlutil')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const ledgerUtil = require('../../../common/lib/ledgerUtil')

// Style
const globalStyles = require('../styles/global')
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
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const location = activeFrame.get('location', '')
    const locationId = getBaseUrl(location)
    const publisherKey = ledgerState.getVerifiedPublisherLocation(state, locationId)

    const props = {}
    // used in renderer
    props.isVisibleInLedger = ledgerUtil.visibleP(state, publisherKey)
    props.isEnabledForPaymentsPublisher = ledgerUtil.stickyP(state, publisherKey)
    props.isVerifiedPublisher = ledgerState.getPublisherOption(state, publisherKey, 'verified')

    // used in functions
    props.hostPattern = getHostPattern(publisherKey)

    return props
  }

  render () {
    return <span
      data-test-id='publisherButton'
      data-test-authorized={this.props.isEnabledForPaymentsPublisher}
      data-test-verified={this.props.isVerifiedPublisher}
      className={css(styles.addPublisherButtonContainer)}>
      <BrowserButton
        custom={[
          !this.props.isVisibleInLedger && styles.notVisible,
          !this.props.isVisibleInLedger && this.props.isVerifiedPublisher && styles.noFundVerified,
          !this.props.isVisibleInLedger && !this.props.isVerifiedPublisher && styles.noFundUnverified,
          this.props.isVisibleInLedger && !this.props.isEnabledForPaymentsPublisher && this.props.isVerifiedPublisher && styles.noFundVerified,
          this.props.isVisibleInLedger && !this.props.isEnabledForPaymentsPublisher && !this.props.isVerifiedPublisher && styles.noFundUnverified,
          this.props.isVisibleInLedger && this.props.isEnabledForPaymentsPublisher && this.props.isVerifiedPublisher && styles.fundVerified,
          this.props.isVisibleInLedger && this.props.isEnabledForPaymentsPublisher && !this.props.isVerifiedPublisher && styles.fundUnverified
        ]}
        l10nId={this.l10nString}
        onClick={this.onAuthorizePublisher}
      />
    </span>
  }
}

module.exports = ReduxComponent.connect(PublisherToggle)

const styles = StyleSheet.create({
  addPublisherButtonContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    height: globalStyles.spacing.buttonHeight,
    width: globalStyles.spacing.buttonWidth,
    minHeight: globalStyles.spacing.buttonHeight,
    minWidth: globalStyles.spacing.buttonWidth,
    borderWidth: '1px 1px 1px 0px',
    borderStyle: 'solid',
    borderColor: globalStyles.color.urlBarOutline,
    borderRadius: '0 4px 4px 0',
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0'
  },

  noFundVerified: {
    backgroundImage: `url(${noFundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  fundVerified: {
    backgroundImage: `url(${fundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  noFundUnverified: {
    backgroundImage: `url(${noFundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  },

  fundUnverified: {
    backgroundImage: `url(${fundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  },

  notVisible: {
    opacity: 0.3
  }
})
