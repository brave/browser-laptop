/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')

class NotificationItem extends ImmutableComponent {
  clickHandler (buttonIndex, e) {
    const nonce = this.props.detail.get('options').get('nonce')
    if (nonce) {
      ipc.emit(messages.NOTIFICATION_RESPONSE + nonce, {},
               this.props.detail.get('message'), buttonIndex)
    } else {
      ipc.send(messages.NOTIFICATION_RESPONSE, this.props.detail.get('message'),
               buttonIndex, this.checkbox ? this.checkbox.checked : false)
    }
  }

  openAdvanced () {
    ipc.emit(messages.SHORTCUT_NEW_FRAME, {}, this.props.detail.get('options').get('advancedLink'))
  }

  toggleCheckbox () {
    this.checkbox.checked = !this.checkbox.checked
  }

  render () {
    let i = 0
    const options = this.props.detail.get('options')
    return <div className='notificationItem'>
      <span className='notificationMessage'>{this.props.detail.get('message')}</span>
      <span className='notificationAdvanced'>
        {
          options.get('advancedText') && options.get('advancedLink')
            ? <span onClick={this.openAdvanced.bind(this)}>{options.get('advancedText')}</span>
            : null
        }
      </span>
      <span className='notificationOptions'>
        {
          options.get('persist')
            ? <span id='rememberOption'>
              <input type='checkbox' ref={(node) => { this.checkbox = node }} />
              <label htmlFor='rememberOption' data-l10n-id='rememberDecision' onClick={this.toggleCheckbox.bind(this)} />
            </span>
            : null
        }
        {
          this.props.detail.get('buttons').map((button) =>
            <button
              type='button'
              className='notificationButton'
              onClick={this.clickHandler.bind(this, i++)}>{button}</button>
          )
        }
      </span>
    </div>
  }
}

class NotificationBar extends ImmutableComponent {
  render () {
    if (!this.props.notifications || !this.props.notifications.size) {
      return null
    }

    return <div className='notificationBar'>
    {
      this.props.notifications.takeLast(3).map((notificationDetail) =>
        <NotificationItem detail={notificationDetail} />
      )
    }
    </div>
  }
}

module.exports = NotificationBar
