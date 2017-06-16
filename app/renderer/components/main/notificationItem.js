/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')
const BrowserButton = require('../common/browserButton')

// Constants
const messages = require('../../../../js/constants/messages')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Utils
const cx = require('../../../../js/lib/classSet')

// Styles
const commonStyles = require('../styles/commonStyles')

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
    appActions.createTabRequested({
      url: this.props.detail.get('options').get('advancedLink')
    })
  }

  toggleCheckbox () {
    this.checkbox.checked = !this.checkbox.checked
  }

  render () {
    let i = 0
    const options = this.props.detail.get('options')
    const greeting = this.props.detail.get('greeting')
    return <div className={cx({
      notificationItem: true,
      [css(commonStyles.notificationBar__notificationItem)]: true,
      [options.get('style')]: options.get('style')
    })}>
      <div className={css(styles.flexJustifyBetween, styles.flexAlignCenter)}>
        <div className={css(styles.marginRight)}>
          {
            greeting
              ? <span className={css(commonStyles.notificationItem__greeting)} data-test-id='greeting'>{greeting}</span>
              : null
          }
          <span className={css(commonStyles.notificationItem__message)}>{this.props.detail.get('message')}</span>
          <span className={css(styles.advanced)}>
            {
              options.get('advancedText') && options.get('advancedLink')
                ? <span onClick={this.openAdvanced.bind(this)}>{options.get('advancedText')}</span>
                : null
            }
          </span>
        </div>
        <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
          {
            options.get('persist')
              ? <span id='rememberOption'>
                <input className={css(styles.checkbox)} type='checkbox' ref={(node) => { this.checkbox = node }} />
                <label className={css(styles.label)} htmlFor='rememberOption' data-l10n-id='rememberDecision' onClick={this.toggleCheckbox.bind(this)} />
              </span>
              : null
          }
          {
            this.props.detail.get('buttons').map((button) =>
              <BrowserButton secondaryColor notificationItem groupedItem
                iconClass={button.get('className')}
                testId='notificationButton'
                label={button.get('text')}
                onClick={this.clickHandler.bind(this, i++)}
              />
            )
          }
        </span>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  flexJustifyBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    flexFlow: 'row wrap'
  },
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },
  marginRight: {
    marginRight: '6px'
  },
  label: {
    fontSize: '15px',
    padding: '0 10px 0 0',
    color: '#666'
  },
  checkbox: {
    marginRight: '3px'
  },
  advanced: {
    color: 'grey',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '13px',
    margin: '5px'
  }
})

module.exports = NotificationItem
