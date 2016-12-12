/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const siteUtil = require('../state/siteUtil')
const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')

class NoScriptInfo extends ImmutableComponent {
  get numberBlocked () {
    const blocked = this.props.frameProps.getIn(['noScript', 'blocked'])
    return blocked ? blocked.size : 0
  }

  get origin () {
    return siteUtil.getOrigin(this.props.frameProps.get('location'))
  }

  get isPrivate () {
    return this.props.frameProps.get('isPrivate')
  }

  reload () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD)
  }

  onAllow (setting) {
    if (!this.origin) {
      return
    }
    appActions.changeSiteSetting(this.origin, 'noScript', setting)
    this.reload()
  }

  get buttons () {
    if (!this.props.noScriptGlobalEnabled) {
      // NoScript is not turned on globally
      return <div><Button l10nId='allow' className='actionButton'
        onClick={this.onAllow.bind(this, false)} /></div>
    } else {
      return <div>
        <Button l10nId='allowScriptsOnce' className='actionButton'
          onClick={this.onAllow.bind(this, 0)} />
        {this.isPrivate
          ? null
          : <div>
            <div><Button l10nId='allowScriptsTemp' className='subtleButton'
              onClick={this.onAllow.bind(this, 1)} /></div>
            <div><Button l10nId='allow' className='subtleButton'
              onClick={this.onAllow.bind(this, false)} /></div>
          </div>}
      </div>
    }
  }

  render () {
    const l10nArgs = {
      numberBlocked: this.numberBlocked,
      site: this.props.frameProps.get('location') || 'this page'
    }
    return <Dialog onHide={this.props.onHide} className='noScriptInfo' isClickDismiss>
      <div className='dialogInner'>
        <div className='truncate' data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id={this.numberBlocked === 1 ? 'scriptBlocked' : 'scriptsBlocked'} />
        {this.buttons}
      </div>
    </Dialog>
  }
}

NoScriptInfo.propTypes = {
  noScriptGlobalEnabled: React.PropTypes.bool,
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = NoScriptInfo
