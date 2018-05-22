/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer

// Components
const ReduxComponent = require('../../reduxComponent')
const NavigationButton = require('./navigationButton')
const Back = require('../../../../../icons/back')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// State
const tabState = require('../../../../common/state/tabState')

// Constants
const messages = require('../../../../../js/constants/messages')

// Utils
const eventUtil = require('../../../../../js/lib/eventUtil')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')
const {isNavigatableAboutPage, getBaseUrl} = require('../../../../../js/lib/appUrlUtil')

class BackButton extends React.Component {
  constructor (props) {
    super(props)
    this.onBack = this.onBack.bind(this)
    this.onBackLongPress = this.onBackLongPress.bind(this)
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
  }

  componentWillUnmount () {
    ipc.off(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
  }

  onBack (e) {
    if (e && eventUtil.isForSecondaryAction(e) && this.props.isNavigable) {
      if (this.props['canGoBack']) {
        appActions.tabCloned(this.props.activeTabId, {
          back: true,
          active: !!e.shiftKey
        })
      }
    } else {
      appActions.onGoBack(this.props.activeTabId)
    }
  }

  onBackLongPress (target) {
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoBackLong(this.props.activeTabId, {
      left: rect.left,
      bottom: rect.bottom
    })
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const swipeLeftPercent = state.get('swipeLeftPercent')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const activeTab = tabState.getByTabId(state, activeTabId) || Immutable.Map()
    const activeTabShowingMessageBox = !!(!activeTab.isEmpty() && tabState.isShowingMessageBox(state, activeTabId))

    const props = {}
    // used in renderer
    props.canGoBack = activeTab.get('canGoBack') && !activeTabShowingMessageBox
    props.swipeLeftPercent = swipeLeftPercent ? (swipeLeftPercent + 1) * 1.2 : 1
    props.swipeLeftOpacity = swipeLeftPercent ? 1 - (swipeLeftPercent > 0.65 ? 0.65 : swipeLeftPercent) : 1

    if (swipeLeftPercent === 1) {
      props.swipeLeftOpacity = 1
    }

    // used in other functions
    props.isNavigable = activeFrame && isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    props.activeTabId = activeTabId

    return props
  }

  render () {
    return <NavigationButton
      testId={
        this.props.canGoBack
          ? 'navigationBackButtonEnabled'
          : 'navigationBackButtonDisabled'
      }
      l10nId={'backButton'}
      class={'backButton'}
      isNav
      disabled={!this.props.canGoBack}
      swipePercent={this.props.swipeLeftPercent}
      swipeOpacity={this.props.swipeLeftOpacity}
      onClick={this.onBack}
      onLongPress={this.onBackLongPress}
    >
      <Back />
    </NavigationButton>
  }
}

module.exports = ReduxComponent.connect(BackButton)
