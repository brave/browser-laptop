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

  reload () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD)
  }

  onAllowOnce () {
    if (!this.origin) {
      return
    }
    ipc.send(messages.TEMPORARY_ALLOW_SCRIPTS, this.origin)
    this.reload()
  }

  onAllow (temp) {
    if (!this.origin) {
      return
    }
    appActions.changeSiteSetting(this.origin, 'noScript', false, temp)
    this.reload()
  }

  render () {
    const l10nArgs = {
      numberBlocked: this.numberBlocked,
      site: this.props.frameProps.get('location') || 'this page'
    }
    return <Dialog onHide={this.props.onHide} className='noScriptInfo' isClickDismiss>
      <div>
        <div className='truncate' data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id={this.numberBlocked === 1 ? 'scriptBlocked' : 'scriptsBlocked'} />
        <div>
          {
            // TODO: restore the allow-once button
            // TODO: If this is a private tab, this should only allow scripts
            // temporarily. Depends on #1824
            <Button l10nId='allow' className='actionButton'
              onClick={this.onAllow.bind(this, false)} />
          }
        </div>
      </div>
    </Dialog>
  }
}

NoScriptInfo.propTypes = {
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = NoScriptInfo
