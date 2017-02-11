/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Dialog = require('../../../js/components/dialog')
const Button = require('../../../js/components/button')
const appActions = require('../../../js/actions/appActions')
const siteUtil = require('../../../js/state/siteUtil')
const ipc = require('electron').ipcRenderer
const messages = require('../../../js/constants/messages')

const {StyleSheet, css} = require('aphrodite')
const commonStyles = require('./styles/commonStyles')

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
    const className = css(styles.allowScriptsButtons)

    if (!this.props.noScriptGlobalEnabled) {
      // NoScript is not turned on globally
      return <div><Button l10nId='allow' className='actionButton'
        onClick={this.onAllow.bind(this, false)} /></div>
    } else {
      return <div className={className}>
        <Button l10nId='allowScriptsOnce' className='actionButton'
          onClick={this.onAllow.bind(this, 0)} />
        {this.isPrivate
          ? null
          : <Button l10nId='allowScriptsTemp' className='subtleButton'
            onClick={this.onAllow.bind(this, 1)} />}
        {this.isPrivate
          ? null
          : <Button l10nId='allow' className='subtleButton'
            onClick={this.onAllow.bind(this, false)} />}
      </div>
    }
  }

  render () {
    const l10nArgs = {
      numberBlocked: this.numberBlocked,
      site: this.props.frameProps.get('location') || 'this page'
    }

    const className = css(
      commonStyles.flyoutDialog,
      styles.dialogInner
    )

    return <Dialog onHide={this.props.onHide} className='noScriptInfo' isClickDismiss>
      <div className={className}>
        <div className={css(styles.truncate)} data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id={this.numberBlocked === 1 ? 'scriptBlocked' : 'scriptsBlocked'} />
        {this.buttons}
      </div>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  dialogInner: {
    right: '20px',
    width: 'auto',
    maxWidth: '350px',
    textAlign: 'center',
    fontSize: '15px',
    cursor: 'default'
  },

  truncate: {
    marginBottom: '5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  allowScriptsButtons: {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'center'
  }
})

NoScriptInfo.propTypes = {
  noScriptGlobalEnabled: React.PropTypes.bool,
  frameProps: React.PropTypes.object,
  onHide: React.PropTypes.func
}

module.exports = NoScriptInfo
