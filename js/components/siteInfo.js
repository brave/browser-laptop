/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet')
const {isPotentialPhishingUrl} = require('../lib/urlutil')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const webviewActions = require('../actions/webviewActions')
const messages = require('../constants/messages')
const siteUtil = require('../state/siteUtil')
const platformUtil = require('../../app/common/lib/platformUtil')

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
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, {}, this.location)
    this.props.onHide()
  }
  onDenyRunInsecureContent () {
    appActions.removeSiteSetting(siteUtil.getOrigin(this.location),
      'runInsecureContent', this.isPrivate)
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, {}, this.location)
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
      secureIcon = <li><span
        className={cx({
          fa: true,
          'fa-lock': true,
          extendedValidation: this.isExtendedValidation
        })} /><span data-l10n-id='secureConnection' /></li>
    } else if (this.isSecure === 1 && !this.runInsecureContent) {
      // passive mixed content loaded
      secureIcon = <li><span className='fa fa-unlock' /><span data-l10n-id='partiallySecureConnection' /></li>
    } else {
      // insecure
      secureIcon = <li><span className='fa fa-unlock' /><span data-l10n-id='insecureConnection' /></li>
    }

    let partitionInfo
    if (this.partitionNumber) {
      partitionInfo = <li><span className='fa fa-user' />
        <span data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id='sessionInfo' /></li>
    }

    let connectionInfo = null
    let viewCertificateButton = null
    // TODO(Anthony): Hide it until muon support linux
    if (!platformUtil.isLinux()) {
      viewCertificateButton =
        <Button l10nId='viewCertificate' className='primaryButton viewCertificate' onClick={this.onViewCertificate} />
    }

    if (this.maybePhishingLocation) {
      connectionInfo =
        <div className='connectionInfo' data-l10n-id='phishingConnectionInfo' />
    } else if (this.isBlockedRunInsecureContent) {
      connectionInfo =
        <li>
          <ul>
            <li><span className='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' /></li>
            <li>
              <Button l10nId='allowRunInsecureContent' className='whiteButton allowRunInsecureContentButton' onClick={this.onAllowRunInsecureContent} />
              <Button l10nId='dismissAllowRunInsecureContent' className='primaryButton dismissAllowRunInsecureContentButton' onClick={this.props.onHide} />
            </li>
          </ul>
        </li>
    } else if (this.runInsecureContent) {
      connectionInfo =
        <li>
          <ul>
            <li><span className='denyRunInsecureContentWarning' data-l10n-id='denyRunInsecureContentWarning' /></li>
            <li>
              <Button l10nId='denyRunInsecureContent' className='primaryButton denyRunInsecureContentButton' onClick={this.onDenyRunInsecureContent} />
              <Button l10nId='dismissDenyRunInsecureContent' className='whiteButton dismissDenyRunInsecureContentButton' onClick={this.props.onHide} />
            </li>
          </ul>
        </li>
    } else if (this.isSecure === true) {
      connectionInfo =
        <div>
          <div className='connectionInfo' data-l10n-id='secureConnectionInfo' />
          {viewCertificateButton}
        </div>
    } else if (this.isSecure === 1) {
      connectionInfo =
        <div>
          <div className='connectionInfo' data-l10n-id='partiallySecureConnectionInfo' />
          {viewCertificateButton}
        </div>
    } else {
      connectionInfo =
        <div className='connectionInfo' data-l10n-id='insecureConnectionInfo' />
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
          connectionInfo
        }
      </ul>
    </Dialog>
  }
}

SiteInfo.propTypes = {
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = SiteInfo
