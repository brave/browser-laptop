/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../../reduxComponent')
const NavigationButton = require('./navigationButton')

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
      <svg xmlns='http://www.w3.org/2000/svg' width='12' height='14'>
        <g fill='none' fillRule='evenodd' transform='translate(-1 -1)'>
          <path className={css(styles.backButton__path)} d='M2.4266 8.312l8.756 5.373c.167.103.32.039.379.007.057-.032.192-.129.192-.327V2.619c0-.198-.135-.295-.192-.327-.057-.033-.21-.096-.379.008l-8.756 5.372c-.161.099-.179.257-.179.32s.018.221.179.32m8.951 6.681c-.293 0-.586-.081-.849-.243l-8.755-5.373h-.001c-.485-.298-.775-.815-.775-1.385 0-.569.29-1.087.775-1.385l8.757-5.373c.506-.312 1.122-.325 1.642-.033.521.291.832.821.832 1.418v10.746c0 .597-.311 1.127-.832 1.418-.25.14-.522.21-.794.21' />
        </g>
      </svg>
    </NavigationButton>
  }
}

const styles = StyleSheet.create({
  backButton__path: {
    fill: 'var(--icon-line-color)'
  }
})

module.exports = ReduxComponent.connect(BackButton)
