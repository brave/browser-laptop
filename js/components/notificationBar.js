/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

const ipc = require('electron').ipcRenderer
const messages = require('../constants/messages')
const getOrigin = require('../state/siteUtil').getOrigin

class NotificationItem extends ImmutableComponent {
  clickHandler (buttonIndex, e) {
    const nonce = this.props.detail.get('options').get('nonce')
    if (nonce) {
      ipc.emit(messages.NOTIFICATION_RESPONSE + nonce, {},
               this.props.detail.get('message'),
               buttonIndex, this.checkbox ? this.checkbox.checked : false)
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
    const greeting = this.props.detail.get('greeting')
    return <div className={'notificationItem ' + (options.get('style') || '')}>
      {
        greeting
          ? <span className='greeting'>{greeting}</span>
          : null
      }
      <span className='message'>{this.props.detail.get('message')}</span>
      <span className='notificationAdvanced'>
        {
          options.get('advancedText') && options.get('advancedLink')
            ? <span onClick={this.openAdvanced.bind(this)}>{options.get('advancedText')}</span>
            : null
        }
      </span>
      <span className='options'>
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
              className={'button ' + (button.get('className') || '')}
              onClick={this.clickHandler.bind(this, i++)}>{button.get('text')}</button>
          )
        }
      </span>
    </div>
  }
}

class NotificationBar extends ImmutableComponent {
  render () {
    const activeOrigin = getOrigin(this.props.activeFrame.get('location'))
    if (!activeOrigin) {
      return null
    }
    const activeNotifications = this.props.notifications.filter((item) =>
      item.get('frameOrigin') ? activeOrigin === item.get('frameOrigin') : true)

    if (!activeNotifications.size) {
      return null
    }

    return <div className='notificationBar'>
    {
      activeNotifications.takeLast(3).map((notificationDetail) =>
        <NotificationItem detail={notificationDetail} />
      )
    }
    </div>
  }
}

module.exports = NotificationBar
