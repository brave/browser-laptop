/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const {BrowserButton} = require('../common/browserButton')

// Constants
const messages = require('../../../../js/constants/messages')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Utils
const cx = require('../../../../js/lib/classSet')

// Styles
const commonStyles = require('../styles/commonStyles')

class NotificationItem extends React.Component {
  constructor (props) {
    super(props)
    this.openAdvanced = this.openAdvanced.bind(this)
    this.toggleCheckbox = this.toggleCheckbox.bind(this)
  }

  clickHandler (buttonIndex) {
    if (this.props.nonce) {
      ipc.emit(
        messages.NOTIFICATION_RESPONSE + this.props.nonce,
        {},
        this.props.message,
        buttonIndex,
        this.checkbox ? this.checkbox.checked : false
      )
    } else {
      ipc.send(
        messages.NOTIFICATION_RESPONSE,
        this.props.message,
        buttonIndex,
        this.checkbox ? this.checkbox.checked : false
      )
    }
  }

  openAdvanced () {
    appActions.createTabRequested({
      url: this.props.advancedLink
    })
  }

  toggleCheckbox () {
    this.checkbox.checked = !this.checkbox.checked
  }

  mergeProps (state, ownProps) {
    const notification = state.get('notifications')
        .find((notification) => {
          return notification.get('message') === ownProps.message
        }) || Immutable.Map()

    const props = {}
    props.message = ownProps.message
    props.greeting = notification.get('greeting')
    props.buttons = notification.get('buttons') // TODO (nejc) only primitives
    props.style = notification.getIn(['options', 'style'])
    props.advancedText = notification.getIn(['options', 'advancedText'])
    props.advancedLink = notification.getIn(['options', 'advancedLink'])
    props.persist = notification.getIn(['options', 'persist'])
    props.nonce = notification.getIn(['options', 'nonce'])

    return props
  }

  render () {
    return <div className={cx({
      notificationItem: true,
      [css(commonStyles.notificationBar__notificationItem)]: true,
      [this.props.style]: this.props.style
    })}>
      <div className={css(styles.flexJustifyBetween, styles.flexAlignCenter)}>
        <div className={css(styles.marginRight)}>
          {
            this.props.greeting
              ? <span className={css(commonStyles.notificationItem__greeting)} data-test-id='greeting'>{this.props.greeting}</span>
              : null
          }
          <span className={css(commonStyles.notificationItem__message)}>{this.props.message}</span>
          <span className={css(styles.advanced)}>
            {
              this.props.advancedText && this.props.advancedLink
                ? <span onClick={this.openAdvanced}>{this.props.advancedText}</span>
                : null
            }
          </span>
        </div>
        <span className={css(styles.flexAlignCenter)} data-test-id='notificationOptions'>
          {
            this.props.persist
              ? <span id='rememberOption'>
                <input className={css(styles.checkbox)} type='checkbox' ref={(node) => { this.checkbox = node }} />
                <label className={css(styles.label)} htmlFor='rememberOption' data-l10n-id='rememberDecision' onClick={this.toggleCheckbox} />
              </span>
              : null
          }
          {
            this.props.buttons.map((button, i) =>
              <BrowserButton groupedItem secondaryColor notificationItem
                iconClass={button.get('className')}
                testId='notificationButton'
                label={button.get('text')}
                onClick={this.clickHandler.bind(this, i)}
              />
            )
          }
        </span>
      </div>
    </div>
  }
}

module.exports = ReduxComponent.connect(NotificationItem)

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
