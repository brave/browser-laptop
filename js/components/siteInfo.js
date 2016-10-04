/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const messages = require('../constants/messages')
const siteUtil = require('../state/siteUtil')

class SiteInfo extends ImmutableComponent {
  constructor () {
    super()
    this.onAllowRunInsecureContent = this.onAllowRunInsecureContent.bind(this)
    this.onDenyRunInsecureContent = this.onDenyRunInsecureContent.bind(this)
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
  render () {
    let secureIcon
    if (this.isSecure && !this.runInsecureContent) {
      secureIcon = <li><span
        className={cx({
          fa: true,
          'fa-lock': true,
          extendedValidation: this.isExtendedValidation
        })} /><span data-l10n-id='secureConnection' /></li>
    } else if (this.runInsecureContent) {
      secureIcon = <li><span className='fa fa-unlock' /><span data-l10n-id='mixedConnection' /></li>
    } else {
      secureIcon = <li><span className='fa fa-unlock' /><span data-l10n-id='insecureConnection' data-l10n-args={JSON.stringify(l10nArgs)} /></li>
    }

    // Figure out the partition info display
    let l10nArgs = {
      partitionNumber: this.partitionNumber
    }

    let partitionInfo
    if (this.partitionNumber) {
      partitionInfo = <li><span className='fa fa-user' />
        <span data-l10n-args={JSON.stringify(l10nArgs)} data-l10n-id='sessionInfo' /></li>
    }

    let runInsecureContentInfo = null
    if (this.isBlockedRunInsecureContent) {
      runInsecureContentInfo =
        <li>
          <ul>
            <li><span className='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' /></li>
            <li>
              <Button l10nId='allowRunInsecureContent' className='secondaryAltButton allowRunInsecureContentButton' onClick={this.onAllowRunInsecureContent} />
              <Button l10nId='dismissAllowRunInsecureContent' className='primaryButton dismissAllowRunInsecureContentButton' onClick={this.props.onHide} />
            </li>
          </ul>
        </li>
    } else if (this.runInsecureContent) {
      runInsecureContentInfo =
        <li>
          <ul>
            <li><span className='denyRunInsecureContentWarning' data-l10n-id='denyRunInsecureContentWarning' /></li>
            <li>
              <Button l10nId='denyRunInsecureContent' className='primaryButton denyRunInsecureContentButton' onClick={this.onDenyRunInsecureContent} />
              <Button l10nId='dismissDenyRunInsecureContent' className='secondaryAltButton dismissDenyRunInsecureContentButton' onClick={this.props.onHide} />
            </li>
          </ul>
        </li>
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
          runInsecureContentInfo
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
