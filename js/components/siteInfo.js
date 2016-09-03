/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const messages = require('../constants/messages')
const siteUtil = require('../state/siteUtil')

class SiteInfo extends ImmutableComponent {
  constructor () {
    super()
    this.onAllowRunInsecureContent = this.onAllowRunInsecureContent.bind(this)
  }
  onAllowRunInsecureContent () {
    appActions.changeSiteSetting(siteUtil.getOrigin(this.isBlockedRunInsecureContent), 'runInsecureContent', true)
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, {}, this.isBlockedRunInsecureContent)
    this.props.onHide()
  }
  get isExtendedValidation () {
    return this.props.frameProps.getIn(['security', 'isExtendedValidation'])
  }
  get isSecure () {
    return this.props.frameProps.getIn(['security', 'isSecure'])
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

    let runInsecureContentWarning = null
    if (this.isBlockedRunInsecureContent) {
      runInsecureContentWarning =
        <li>
          <ul>
            <li><span className='runInsecureContentWarning' data-l10n-id='runInsecureContentWarning' /></li>
            <li>
              <Button l10nId='allowRunInsecureContent' className='secondaryAltButton allowRunInsecureContentButton' onClick={this.onAllowRunInsecureContent} />
              <Button l10nId='denyRunInsecureContent' className='primaryButton denyRunInsecureContentButton' onClick={this.props.onHide} />
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
        runInsecureContentWarning
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
