/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const Dialog = require('../../../js/components/dialog')
const Button = require('../../../js/components/button')
const SwitchControl = require('../../../js/components/switchControl')
const appActions = require('../../../js/actions/appActions')
const KeyCodes = require('../../common/constants/keyCodes')
const config = require('../../../js/constants/config')
const {makeImmutable} = require('../../common/state/immutableUtil')

const {StyleSheet, css} = require('aphrodite')
const commonStyles = require('./styles/commonStyles')
const globalStyles = require('./styles/global')

class MessageBox extends ImmutableComponent {
  constructor () {
    super()
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onSuppressChanged = this.onSuppressChanged.bind(this)
  }

  componentWillMount () {
    document.addEventListener('keydown', this.onKeyDown)
  }
  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  get tabId () {
    return this.props.tabId || ''
  }

  get title () {
    const msgBoxTitle = (this.props.detail && this.props.detail.get('title')) || ''
    return msgBoxTitle.replace(config.braveExtensionId, 'Brave')
  }

  get message () {
    return (this.props.detail && this.props.detail.get('message')) || ''
  }

  get buttons () {
    return (this.props.detail && this.props.detail.get('buttons')) || makeImmutable(['ok'])
  }

  get cancelId () {
    return this.props.detail && this.props.detail.get('cancelId')
  }

  get suppress () {
    return (this.props.detail && this.props.detail.get('suppress')) || false
  }

  get showSuppress () {
    return (this.props.detail && this.props.detail.get('showSuppress')) || false
  }

  onKeyDown (e) {
    if (this.props.isActive) {
      switch (e.keyCode) {
        case KeyCodes.ENTER:
          this.onDismiss(this.tabId)
          break
        case KeyCodes.ESC:
          this.onDismiss(this.tabId, this.cancelId)
          break
      }
    }
  }

  onSuppressChanged (e) {
    const detail = this.props.detail.toJS()
    detail.suppress = !detail.suppress
    appActions.tabMessageBoxUpdated(this.tabId, detail)
  }

  onDismiss (tabId, buttonId) {
    const response = {
      suppress: this.suppress,
      result: true
    }

    if (typeof this.cancelId === 'number') {
      response.result = buttonId !== this.cancelId
    }

    appActions.tabMessageBoxDismissed(this.tabId, response)
  }

  get messageBoxButtons () {
    const buttons = []

    for (let index = (this.buttons.size - 1); index > -1; index--) {
      buttons.push(<Button l10nId={this.buttons.get(index)}
        className={index === 0 ? 'primaryButton' : 'whiteButton'}
        onClick={this.onDismiss.bind(this, this.tabId, index)} />)
    }

    return buttons
  }

  render () {
    return <Dialog className={css(styles.dialog)}>
      <div data-test-id={'msgBoxTab_' + this.tabId}
        onClick={this.onClick}
        onKeyDown={this.onKeyDown}
        className={css(
          commonStyles.flyoutDialog,
          styles.container
        )}>
        <div className={css(styles.title)} data-test-id='msgBoxTitle'>
          {this.title}
        </div>
        <div className={css(styles.body)} data-test-id='msgBoxMessage'>
          {this.message}
        </div>
        {
          this.showSuppress
            ? <SwitchControl
              // TODO: refactor SwitchControl
              className={css(commonStyles.noPaddingLeft)}
              rightl10nId='preventMoreAlerts'
              checkedOn={this.suppress}
              onClick={this.onSuppressChanged} />
            : null
        }
        <div className={css(styles.buttons)} data-test-id='msgBoxButtons'>
          {this.messageBoxButtons}
        </div>
      </div>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  dialog: {
    outline: 'none'
  },
  container: {
    outline: 'none',
    display: 'block'
  },
  title: {
    fontWeight: 'bold',
    fontSize: '12pt',
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    userSelect: 'text'
  },
  body: {
    marginTop: globalStyles.spacing.dialogInsideMargin,
    minWidth: '425px',
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    userSelect: 'text'
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: globalStyles.spacing.dialogInsideMargin
  }
})

module.exports = MessageBox
