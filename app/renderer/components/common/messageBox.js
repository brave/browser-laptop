/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('./dialog')
const {BrowserButton} = require('../common/browserButton')
const SwitchControl = require('./switchControl')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')

// State
const tabState = require('../../../common/state/tabState')
const tabMessageBoxState = require('../../../common/state/tabMessageBoxState')
const frameStateUtil = require('../../../../js/state/frameStateUtil.js')

// Utils
const {makeImmutable} = require('../../../common/state/immutableUtil')

// Styles
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')

class MessageBox extends React.Component {
  constructor (props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onSuppressChanged = this.onSuppressChanged.bind(this)
  }

  componentWillMount () {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown (e) {
    if (this.props.isActive) {
      switch (e.keyCode) {
        case KeyCodes.ENTER:
          this.onDismiss(this.props.tabId)
          break
        case KeyCodes.ESC:
          this.onDismiss(this.props.tabId, this.props.cancelId)
          break
      }
    }
  }

  onSuppressChanged () {
    const detail = {
      buttons: this.props.buttons,
      cancelId: this.props.cancelId,
      message: this.props.message,
      showSuppress: this.props.showSuppress,
      suppress: !this.props.suppress,
      title: this.props.title
    }

    appActions.tabMessageBoxUpdated(this.props.tabId, detail)
  }

  onDismiss (tabId, buttonId) {
    const response = {
      suppress: this.props.suppress,
      result: true
    }

    if (typeof this.props.cancelId === 'number') {
      response.result = buttonId !== this.props.cancelId
    }

    appActions.tabMessageBoxDismissed(tabId, response)
  }

  get messageBoxButtons () {
    const buttons = this.props.buttons || makeImmutable(['ok'])
    const newButtons = []

    for (let index = (buttons.size - 1); index > -1; index--) {
      newButtons.push(<BrowserButton
        groupedItem
        l10nId={buttons.get(index)}
        testId={index === 0 ? 'primaryColor' : 'secondaryColor'}
        primaryColor={index === 0}
        secondaryColor={index !== 0}
        onClick={this.onDismiss.bind(this, this.props.tabId, index)} />)
    }

    return newButtons
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const tabId = ownProps.tabId
    const tab = tabState.getByTabId(state, tabId) || Immutable.Map()
    const messageBoxDetail = tab.get('messageBoxDetail', Immutable.Map())

    const props = {}
    // used in renderer
    props.tabId = tabId
    props.message = messageBoxDetail.get('message')
    props.suppress = tabMessageBoxState.getSuppress(state, tabId)
    props.title = tabMessageBoxState.getTitle(state, tabId)
    props.showSuppress = tabMessageBoxState.getShowSuppress(state, tabId)
    props.buttons = tabMessageBoxState.getButtons(state, tabId)

    // used in other functions
    props.cancelId = messageBoxDetail.get('cancelId')
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, tab.getIn(['frame', 'key']))

    return props
  }

  render () {
    return <Dialog testId='messageBoxDialog' className={css(styles.dialog)}>
      <div data-test-id={'msgBoxTab_' + this.props.tabId}
        onKeyDown={this.onKeyDown}
        className={css(
          commonStyles.flyoutDialog,
          styles.container
        )}>
        <div className={css(styles.title)} data-test-id='msgBoxTitle'>
          {this.props.title}
        </div>
        <div className={css(styles.body)} data-test-id='msgBoxMessage'>
          {this.props.message}
        </div>
        <div className={css(this.showSuppress && styles.actions)}>
          {
            this.props.showSuppress
              ? <SwitchControl
                testId='showSuppressSwitch'
                // TODO: refactor SwitchControl
                className={css(
                  commonStyles.noPaddingLeft,
                  styles.switchControl_marginBottom
                )}
                rightl10nId='preventMoreAlerts'
                checkedOn={this.props.suppress}
                onClick={this.onSuppressChanged} />
              : null
          }
          <div className={css(styles.buttons)} data-test-id='msgBoxButtons'>
            {this.messageBoxButtons}
          </div>
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  title: {
    fontWeight: 'bold',
    fontSize: '12pt',
    userSelect: 'text'
  },
  body: {
    marginTop: globalStyles.spacing.dialogInsideMargin,
    minWidth: '425px',
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    userSelect: 'text',
    maxHeight: 'calc(80vh - 220px)',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  actions: {
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'space-between'
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end'
  },

  switchControl_marginBottom: {
    marginBottom: `calc(${globalStyles.spacing.dialogInsideMargin} - 5px)` // 5px = padding of SwitchControl
  }
})

module.exports = ReduxComponent.connect(MessageBox)
