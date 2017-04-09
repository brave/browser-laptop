/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const PropTypes = require('prop-types')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const Button = require('./button')
const appActions = require('../actions/appActions')
const siteUtil = require('../state/siteUtil')
const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')
const urlParse = require('url').parse

class NoScriptCheckbox extends ImmutableComponent {
  toggleCheckbox (e) {
    this.checkbox.checked = !this.checkbox.checked
    e.stopPropagation()
  }

  get id () {
    return `checkbox-for-${this.props.origin}`
  }

  render () {
    return <div className='noScriptCheckbox' id={this.id}
      onClick={this.toggleCheckbox.bind(this)}>
      <input type='checkbox' onClick={(e) => { e.stopPropagation() }}
        ref={(node) => { this.checkbox = node }} defaultChecked
        origin={this.props.origin} />
      <label htmlFor={this.id}>{this.props.origin}</label>
    </div>
  }
}

class NoScriptInfo extends ImmutableComponent {
  get blockedOrigins () {
    const blocked = this.props.frameProps.getIn(['noScript', 'blocked'])
    if (blocked && blocked.size) {
      return new Immutable.Set(blocked.map(siteUtil.getOrigin))
    } else {
      return new Immutable.Set()
    }
  }

  get origin () {
    return siteUtil.getOrigin(this.props.frameProps.get('location'))
  }

  get isPrivate () {
    return this.props.frameProps.get('isPrivate')
  }

  onClickInner (e) {
    e.stopPropagation()
  }

  unselectAll (e) {
    e.stopPropagation()
    let checkboxes = this.checkboxes.querySelectorAll('input')
    if (!checkboxes) {
      return
    }
    checkboxes.forEach((box) => {
      box.checked = false
    })
  }

  reload () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_CLEAN_RELOAD)
  }

  onAllow (setting, e) {
    if (!this.origin) {
      return
    }
    let checkedOrigins = new Immutable.Map()
    this.checkboxes.querySelectorAll('input').forEach((box) => {
      const origin = box.getAttribute('origin')
      if (origin) {
        checkedOrigins = checkedOrigins.set(origin, box.checked ? setting : false)
      }
    })
    if (checkedOrigins.filter((value) => value !== false).size) {
      appActions.noScriptExceptionsAdded(this.origin, checkedOrigins)
      this.reload()
      this.props.onHide()
    }
  }

  get buttons () {
    return <div>
      <Button l10nId='allowScriptsOnce' className='actionButton'
        onClick={this.onAllow.bind(this, 0)} />
      {this.isPrivate
        ? null
        : <span><Button l10nId='allowScriptsTemp' className='subtleButton'
          onClick={this.onAllow.bind(this, 1)} /></span>
      }
    </div>
  }

  render () {
    if (!this.origin) {
      return null
    }
    const l10nArgs = {
      site: urlParse(this.props.frameProps.get('location')).host
    }
    return <Dialog onHide={this.props.onHide} className='noScriptInfo' isClickDismiss>
      <div className='dialogInner' onClick={this.onClickInner}>
        <div className='truncate' data-l10n-args={JSON.stringify(l10nArgs)}
          data-l10n-id={'scriptsBlocked'} />
        {this.blockedOrigins.size
          ? <div>
            <div ref={(node) => { this.checkboxes = node }} className='blockedOriginsList'>
              {this.blockedOrigins.map((origin) => <NoScriptCheckbox origin={origin} />)}
            </div>
            <div data-l10n-id={'unselectAll'}
              className='clickable'
              onClick={this.unselectAll.bind(this)} />
            {this.buttons}
          </div>
          : null}
      </div>
    </Dialog>
  }
}

NoScriptInfo.propTypes = {
  frameProps: PropTypes.object,
  onHide: PropTypes.func
}

module.exports = NoScriptInfo
