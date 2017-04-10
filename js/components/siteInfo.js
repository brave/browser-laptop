/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet')
const {isPotentialPhishingUrl} = require('../lib/urlutil')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const webviewActions = require('../actions/webviewActions')
const siteUtil = require('../state/siteUtil')
const platformUtil = require('../../app/common/lib/platformUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')
const commonStyles = require('../../app/renderer/components/styles/commonStyles')

class SiteInfo extends ImmutableComponent {
  constructor () {
    super()
    this.onAllowRunInsecureContent = this.onAllowRunInsecureContent.bind(this)
    this.onDenyRunInsecureContent = this.onDenyRunInsecureContent.bind(this)
    this.onViewCertificate = this.onViewCertificate.bind(this)
  }
  onAllowRunInsecureContent () {
    appActions.changeSiteSetting(siteUtil.getOrigin(this.location),
      'runInsecureContent', true, this.isPrivate)
    appActions.loadURLRequested(this.props.frameProps.get('tabId'), this.location)
    this.props.onHide()
  }
  onDenyRunInsecureContent () {
    appActions.removeSiteSetting(siteUtil.getOrigin(this.location),
      'runInsecureContent', this.isPrivate)
    appActions.loadURLRequested(this.props.frameProps.get('tabId'), this.location)
    this.props.onHide()
  }
  onViewCertificate () {
    this.props.onHide()
    webviewActions.showCertificate()
  }
  get isExtendedValidation () {
    return this.props.frameProps.getIn(['security', 'isExtendedValidation'])
  }
  get isSecure () {
    return this.props.frameProps.getIn(['security', 'isSecure'])
  }
  get isPrivate () {
    return this.props.frameProps.getIn(['isPrivate'])
  }
  get runInsecureContent () {
    return this.props.frameProps.getIn(['security', 'runInsecureContent'])
  }
  get isBlockedRunInsecureContent () {
    return this.props.frameProps.getIn(['security', 'blockedRunInsecureContent'])
  }
  get partitionNumber () {
    return this.props.frameProps.getIn(['partitionNumber'])
  }
  get location () {
    return this.props.frameProps.getIn(['location'])
  }
  get maybePhishingLocation () {
    return isPotentialPhishingUrl(this.props.frameProps.getIn(['location']))
  }
  render () {
    // Figure out the partition info display
    let l10nArgs = {
      partitionNumber: this.partitionNumber
    }

    let secureIcon
    if (this.isSecure === true && !this.runInsecureContent) {
      // fully secure
      secureIcon =
        <div className={css(styles.secureIcon__wrapper)}>
          <span className={cx({
            fa: true,
            'fa-lock': true,
            [css(styles.secureIcon__fa)]: true,
            [css(styles.secureIcon__extendedValidation)]: this.isExtendedValidation
          })} />
          <span className={css(styles.secureIcon__label)}
            data-test-id='secureConnection'
            data-l10n-id='secureConnection'
          />
        </div>
    } else if (this.isSecure === 1 && !this.runInsecureContent) {
      // passive mixed content loaded
      secureIcon =
        <div className={css(styles.secureIcon__wrapper)}>
          <span className={cx({
            fa: true,
            'fa-unlock': true,
            [css(styles.secureIcon__fa)]: true
          })} />
          <span className={css(styles.secureIcon__label)}
            data-test-id='partiallySecureConnection'
            data-l10n-id='partiallySecureConnection'
          />
        </div>
    } else {
      // insecure
      secureIcon =
        <div className={css(styles.secureIcon__wrapper)}>
          <span className={cx({
            fa: true,
            'fa-unlock': true,
            [css(styles.secureIcon__fa)]: true
          })} />
          <span className={css(styles.secureIcon__label)}
            data-test-id='insecureConnection'
            data-l10n-id='insecureConnection'
          />
        </div>
    }

    let partitionInfo
    if (this.partitionNumber) {
      partitionInfo =
        <div className={css(styles.secureIcon__wrapper)}>
          <span className={cx({
            fa: true,
            'fa-user': true,
            [css(styles.secureIcon__fa)]: true
          })} />
          <span className={css(styles.secureIcon__label)}
            data-test-id='partitionNumber'
            data-l10n-args={JSON.stringify(l10nArgs)}
            data-l10n-id='sessionInfo'
          />
        </div>
    }

    let connectionInfo = null
    let viewCertificateButton = null

    // TODO(Anthony): Hide it until muon support linux
    if (!platformUtil.isLinux()) {
      viewCertificateButton =
        <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
          <Button l10nId='viewCertificate'
            className='primaryButton'
            testId='viewCertificate'
            onClick={this.onViewCertificate}
          />
        </div>
    }

    if (this.maybePhishingLocation) {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-l10n-id='phishingConnectionInfo' data-test-id='phishingConnectionInfo' />
        </div>
    } else if (this.isBlockedRunInsecureContent) {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-test-id='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' />
          <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
            <Button l10nId='allowRunInsecureContent'
              className='whiteButton'
              testId='allowRunInsecureContentButton'
              onClick={this.onAllowRunInsecureContent}
            />
            <Button l10nId='dismissAllowRunInsecureContent'
              className='primaryButton'
              testId='dismissAllowRunInsecureContentButton'
              onClick={this.props.onHide}
            />
          </div>
        </div>
    } else if (this.runInsecureContent) {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-test-id='denyRunInsecureContentWarning' data-l10n-id='denyRunInsecureContentWarning' />
          <div className={css(styles.flexJustifyEnd, styles.viewCertificateButton__wrapper)}>
            <Button l10nId='dismissDenyRunInsecureContent'
              className='whiteButton'
              testId='dismissDenyRunInsecureContentButton'
              onClick={this.props.onHide}
            />
            <Button l10nId='denyRunInsecureContent'
              className='primaryButton'
              testId='denyRunInsecureContentButton'
              onClick={this.onDenyRunInsecureContent}
            />
          </div>
        </div>
    } else if (this.isSecure === true) {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-l10n-id='secureConnectionInfo' />
          {viewCertificateButton}
        </div>
    } else if (this.isSecure === 1) {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-l10n-id='partiallySecureConnectionInfo' />
          {viewCertificateButton}
        </div>
    } else {
      connectionInfo =
        <div className={css(styles.connectionInfo__wrapper)}>
          <div data-l10n-id='insecureConnectionInfo' />
        </div>
    }

    return <Dialog onHide={this.props.onHide} className='siteInfo' isClickDismiss>
      <div onClick={(e) => e.stopPropagation()}
        className={cx({
          [css(commonStyles.flyoutDialog)]: true,
          [css(styles.siteInfo__wrapper)]: true,
          [css(styles.siteInfo__wrapper__large)]: (this.isBlockedRunInsecureContent || this.runInsecureContent)
        })}>
        {
          secureIcon
        }
        {
          partitionInfo
        }
        {
          connectionInfo
        }
      </div>
    </Dialog>
  }
}

SiteInfo.propTypes = {
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

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
    width: 'auto'
  },
  siteInfo__wrapper__large: {
    // temporary workaround
    maxWidth: '500px'
  }
})

module.exports = SiteInfo
