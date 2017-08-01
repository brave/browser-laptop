/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const Button = require('../common/button')

// Actions
const appActions = require('../../../../js/actions/appActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const tabState = require('../../../common/state/tabState')

// Utils
const cx = require('../../../../js/lib/classSet')
const {isPotentialPhishingUrl} = require('../../../../js/lib/urlutil')
const isLinux = require('../../../common/lib/platformUtil').isLinux()
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const urlUtil = require('../../../../js/lib/urlutil')

// Styles
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

class SiteInfo extends React.Component {
  constructor (props) {
    super(props)
    this.onAllowRunInsecureContent = this.onAllowRunInsecureContent.bind(this)
    this.onDenyRunInsecureContent = this.onDenyRunInsecureContent.bind(this)
    this.onViewCertificate = this.onViewCertificate.bind(this)
  }

  onAllowRunInsecureContent () {
    appActions.changeSiteSetting(urlUtil.getOrigin(this.props.location),
      'runInsecureContent', true, this.props.isPrivate)
    appActions.loadURLRequested(this.props.activeTabId, this.props.location)
    this.onHide()
  }

  onDenyRunInsecureContent () {
    appActions.removeSiteSetting(urlUtil.getOrigin(this.props.location),
      'runInsecureContent', this.props.isPrivate)
    appActions.loadURLRequested(this.props.activeTabId, this.props.location)
    this.onHide()
  }

  onViewCertificate () {
    this.onHide()
    webviewActions.showCertificate()
  }

  onHide () {
    windowActions.setSiteInfoVisible(false)
  }

  get secureIcon () {
    if (this.props.isFullySecured) {
      // fully secure
      return <div className={css(styles.secureIcon__wrapper)}>
        <span className={cx({
          fa: true,
          'fa-lock': true,
          [css(styles.secureIcon__fa)]: true,
          [css(styles.secureIcon__extendedValidation)]: this.props.isExtendedValidation
        })} />
        <span
          className={css(styles.secureIcon__label)}
          data-test-id='secureConnection'
          data-l10n-id='secureConnection'
        />
      </div>
    } else if (this.props.isMixedContent) {
      // passive mixed content loaded
      return <div className={css(styles.secureIcon__wrapper)}>
        <span className={cx({
          fa: true,
          'fa-unlock': true,
          [css(styles.secureIcon__fa)]: true
        })} />
        <span
          className={css(styles.secureIcon__label)}
          data-test-id='partiallySecureConnection'
          data-l10n-id='partiallySecureConnection'
        />
      </div>
    } else {
      // insecure
      return <div className={css(styles.secureIcon__wrapper)}>
        <span className={cx({
          fa: true,
          'fa-unlock': true,
          [css(styles.secureIcon__fa)]: true
        })} />
        <span
          className={css(styles.secureIcon__label)}
          data-test-id='insecureConnection'
          data-l10n-id='insecureConnection'
        />
      </div>
    }
  }

  get partitionInfo () {
    if (this.props.partitionNumber) {
      // Figure out the partition info display
      let l10nArgs = {
        partitionNumber: this.props.partitionNumber
      }

      return <div className={css(styles.secureIcon__wrapper)}>
        <span className={cx({
          fa: true,
          'fa-user': true,
          [css(styles.secureIcon__fa)]: true
        })} />
        <span
          className={css(styles.secureIcon__label)}
          data-test-id='partitionNumber'
          data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id='sessionInfo'
        />
      </div>
    }

    return null
  }

  get viewCertificateButton () {
    // TODO(Anthony): Hide it until muon support linux
    if (!isLinux) {
      return <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
        <Button
          l10nId='viewCertificate'
          className='primaryButton'
          testId='viewCertificate'
          onClick={this.onViewCertificate}
        />
      </div>
    }

    return null
  }

  get connectionInfo () {
    const certErrl10nArgs = {
      site: this.props.location
    }

    if (this.props.maybePhishingLocation) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-l10n-id='phishingConnectionInfo' data-test-id='phishingConnectionInfo' />
      </div>
    } else if (this.props.isBlockedRunInsecureContent) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-test-id='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' />
        <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
          <Button
            l10nId='allowRunInsecureContent'
            className='whiteButton'
            testId='allowRunInsecureContentButton'
            onClick={this.onAllowRunInsecureContent}
          />
          <Button
            l10nId='dismissAllowRunInsecureContent'
            className='primaryButton'
            testId='dismissAllowRunInsecureContentButton'
            onClick={this.onHide}
          />
        </div>
        {this.viewCertificateButton}
      </div>
    } else if (this.props.runInsecureContent) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-test-id='denyRunInsecureContentWarning' data-l10n-id='denyRunInsecureContentWarning' />
        <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
          <Button
            l10nId='dismissDenyRunInsecureContent'
            className='whiteButton'
            testId='dismissDenyRunInsecureContentButton'
            onClick={this.onHide}
          />
          <Button
            l10nId='denyRunInsecureContent'
            className='primaryButton'
            testId='denyRunInsecureContentButton'
            onClick={this.onDenyRunInsecureContent}
          />
        </div>
        {this.viewCertificateButton}
      </div>
    } else if (this.props.secureConnection) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-l10n-id='secureConnectionInfo' />
        {this.viewCertificateButton}
      </div>
    } else if (this.props.partiallySecureConnection) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-l10n-id='partiallySecureConnectionInfo' />
        {this.viewCertificateButton}
      </div>
    } else if (this.props.certErrorConnection) {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-l10n-id='certErrConnectionInfo' data-l10n-args={JSON.stringify(certErrl10nArgs)} />
        {this.viewCertificateButton}
      </div>
    } else {
      return <div className={css(styles.connectionInfo__wrapper)}>
        <div data-l10n-id='insecureConnectionInfo' />
      </div>
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const isSecure = activeFrame.getIn(['security', 'isSecure'])
    const runInsecureContent = activeFrame.getIn(['security', 'runInsecureContent'])

    const props = {}
    // used in renderer
    props.isFullySecured = isSecure === true && !runInsecureContent
    props.isMixedContent = isSecure === 1 && !runInsecureContent
    props.isExtendedValidation = activeFrame.getIn(['security', 'isExtendedValidation'])
    props.partitionNumber = activeFrame.get('partitionNumber')
    props.location = activeFrame.get('location')
    props.maybePhishingLocation = isPotentialPhishingUrl(props.location)
    props.isBlockedRunInsecureContent = activeFrame.getIn(['security', 'blockedRunInsecureContent'])
    props.runInsecureContent = activeFrame.getIn(['security', 'runInsecureContent'])
    props.secureConnection = isSecure === true
    props.partiallySecureConnection = isSecure === 1
    props.certErrorConnection = isSecure === 2

    // used in other function
    props.isPrivate = activeFrame.get('isPrivate')
    props.activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)

    return props
  }

  render () {
    return <Dialog testId='siteInfoDialog' onHide={this.onHide} className='siteInfo' isClickDismiss>
      <div onClick={(e) => e.stopPropagation()}
        className={cx({
          [css(commonStyles.flyoutDialog)]: true,
          [css(styles.siteInfo__wrapper)]: true,
          [css(styles.siteInfo__wrapper__large)]: (this.isBlockedRunInsecureContent || this.runInsecureContent)
        })}>
        {
          this.secureIcon
        }
        {
          this.partitionInfo
        }
        {
          this.connectionInfo
        }
      </div>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(SiteInfo)

const styles = StyleSheet.create({
  flexJustifyEnd: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  secureIcon__wrapper: {
    display: 'flex',
    alignItems: 'center'
  },
  secureIcon__fa: {
    position: 'absolute'
  },
  secureIcon__extendedValidation: {
    color: '#008000'
  },
  secureIcon__label: {
    position: 'relative',
    left: globalStyles.spacing.dialogInsideMargin
  },

  viewCertificateButton__wrapper: {
    marginTop: globalStyles.spacing.dialogInsideMargin
  },

  connectionInfo__wrapper: {
    display: 'flex',
    flexFlow: 'column nowrap',
    margin: `${globalStyles.spacing.dialogInsideMargin} 0 0 ${globalStyles.spacing.dialogInsideMargin}`
  },

  siteInfo__wrapper: {
    maxHeight: '300px',
    maxWidth: '400px',
    width: 'auto',

    // Issue #8650
    userSelect: 'none',
    cursor: 'default'
  },
  siteInfo__wrapper__large: {
    // temporary workaround
    maxWidth: '500px'
  }
})
