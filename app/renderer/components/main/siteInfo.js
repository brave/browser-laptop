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
    this.onDisableTor = this.onDisableTor.bind(this)
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

  onDisableTor () {
    appActions.recreateTorTab(false, this.props.activeTabId,
      this.props.activeTabIndex)
  }

  onRestartTor () {
    appActions.restartTor()
  }

  get secureIcon () {
    if (this.props.torConnectionError) {
      return <div className={css(styles.connectionInfo__header)} data-l10n-id='torConnectionError' />
    }
    if (this.props.isFullySecured) {
      // fully secure
      return <div className={css(styles.secureIcon)}>
        <span className={cx({
          [globalStyles.appIcons.lock]: true,
          [css(styles.secureIcon__fa, this.props.isExtendedValidation && styles.secureIcon__fa_extendedValidation)]: true
        })} />
        <span
          className={css(styles.secureIcon__label)}
          data-test-id='secureConnection'
          data-l10n-id='secureConnection'
        />
      </div>
    } else if (this.props.isMixedContent) {
      // passive mixed content loaded
      return <div className={css(styles.secureIcon)}>
        <span className={cx({
          [globalStyles.appIcons.unlock]: true,
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
      return <div className={css(styles.secureIcon)}>
        <span className={cx({
          [globalStyles.appIcons.unlock]: true,
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

      return <div className={css(styles.secureIcon)}>
        <span className={cx({
          [globalStyles.appIcons.user]: true,
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
      return <div className={css(styles.connectionInfo__viewCertificateButton)}>
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

    if (this.props.torConnectionError) {
      // Log the error for advanced users to debug
      console.log('Tor connection error:', this.props.torConnectionError)
      return <div>
        <div className={css(styles.torBody)}>
          <div className={css(styles.torConnectionInfo)} data-l10n-id='torConnectionErrorInfo' />
          <Button
            l10nId='torConnectionErrorRetry'
            className='primaryButton'
            onClick={this.onRestartTor}
          />
          <Button
            l10nId='torConnectionErrorDisable'
            className='whiteButton'
            onClick={this.onDisableTor}
          />
        </div>
      </div>
    } else if (this.props.maybePhishingLocation) {
      return <div className={css(styles.connectionInfo)}>
        <div data-l10n-id='phishingConnectionInfo' data-test-id='phishingConnectionInfo' />
      </div>
    } else if (this.props.isBlockedRunInsecureContent) {
      return <div className={css(styles.connectionInfo)}>
        <div data-test-id='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' />
        <div className={css(styles.connectionInfo__viewCertificateButton)}>
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
      return <div className={css(styles.connectionInfo)}>
        <div data-test-id='denyRunInsecureContentWarning' data-l10n-id='denyRunInsecureContentWarning' />
        <div className={css(styles.connectionInfo__viewCertificateButton)}>
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
      return <div className={css(styles.connectionInfo)}>
        <div data-l10n-id='secureConnectionInfo' />
        {this.viewCertificateButton}
      </div>
    } else if (this.props.partiallySecureConnection) {
      return <div className={css(styles.connectionInfo)}>
        <div data-l10n-id='partiallySecureConnectionInfo' />
        {this.viewCertificateButton}
      </div>
    } else if (this.props.certErrorConnection) {
      return <div className={css(styles.connectionInfo)}>
        <div data-l10n-id='certErrConnectionInfo' data-l10n-args={JSON.stringify(certErrl10nArgs)} />
        {this.viewCertificateButton}
      </div>
    } else {
      return <div className={css(styles.connectionInfo)}>
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
    props.torConnectionError = frameStateUtil.isTor(activeFrame) && state.getIn(['tor', 'error'])

    // used in other function
    props.isPrivate = activeFrame.get('isPrivate')
    props.activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    props.activeTabIndex = frameStateUtil.getIndexByTabId(currentWindow, props.activeTabId)

    return props
  }

  render () {
    return <Dialog testId='siteInfoDialog' onHide={this.onHide} className='siteInfo' isClickDismiss>
      <div onClick={(e) => e.stopPropagation()}
        className={css(
          commonStyles.flyoutDialog,
          styles.siteInfo,
          (this.props.isBlockedRunInsecureContent || this.props.runInsecureContent) && styles.siteInfo_large
      )}>
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

const styles = StyleSheet.create({
  secureIcon: {
    display: 'flex',
    alignItems: 'center'
  },

  secureIcon__fa: {
    position: 'absolute'
  },

  secureIcon__fa_extendedValidation: {
    color: '#008000'
  },

  secureIcon__label: {
    position: 'relative',
    left: globalStyles.spacing.dialogInsideMargin
  },

  connectionInfo: {
    display: 'flex',
    flexFlow: 'column nowrap',
    margin: `${globalStyles.spacing.dialogInsideMargin} 0 0 ${globalStyles.spacing.dialogInsideMargin}`
  },

  connectionInfo__header: {
    color: globalStyles.color.braveOrange,
    fontSize: '1rem'
  },

  connectionInfo__viewCertificateButton: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: globalStyles.spacing.dialogInsideMargin
  },

  torConnectionInfo: {
    marginTop: '15px',
    marginBottom: '20px'
  },

  torBody: {
    paddingBottom: '15px',
    lineHeight: '1.5em'
  },

  siteInfo: {
    maxHeight: '300px',
    maxWidth: '400px',
    width: 'auto',

    // Issue #8650
    userSelect: 'none',
    cursor: 'default'
  },

  siteInfo_large: {
    // temporary workaround
    maxWidth: '500px'
  }
})

module.exports = ReduxComponent.connect(SiteInfo)
