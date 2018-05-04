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

class ForwardButton extends React.Component {
  constructor (props) {
    super(props)
    this.onForward = this.onForward.bind(this)
    this.onForwardLongPress = this.onForwardLongPress.bind(this)
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)
  }

  componentWillUnmount () {
    ipc.off(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)
  }

  onForward (e) {
    if (e && eventUtil.isForSecondaryAction(e) && this.props.isNavigable) {
      if (this.props['canGoForward']) {
        appActions.tabCloned(this.props.activeTabId, {
          forward: true,
          active: !!e.shiftKey
        })
      }
    } else {
      appActions.onGoForward(this.props.activeTabId)
    }
  }

  onForwardLongPress (target) {
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoForwardLong(this.props.activeTabId, {
      left: rect.left,
      bottom: rect.bottom
    })
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const swipeRightPercent = state.get('swipeRightPercent')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const activeTab = tabState.getByTabId(state, activeTabId) || Immutable.Map()
    const activeTabShowingMessageBox = !!(!activeTab.isEmpty() && tabState.isShowingMessageBox(state, activeTabId))

    const props = {}
    // used in renderer
    props.canGoForward = activeTab.get('canGoForward') && !activeTabShowingMessageBox
    props.swipeRightPercent = swipeRightPercent ? (swipeRightPercent + 1) * 1.2 : 1
    props.swipeRightOpacity = swipeRightPercent ? 1 - (swipeRightPercent > 0.65 ? 0.65 : swipeRightPercent) : 1

    if (swipeRightPercent === 1) {
      props.swipeRightOpacity = 1
    }

    // used in other functions
    props.isNavigable = activeFrame && isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    props.activeTabId = activeTabId

    return props
  }

  render () {
    return <NavigationButton
      testId={
        this.props.canGoForward
          ? 'navigationForwardButtonEnabled'
          : 'navigationForwardButtonDisabled'
      }
      l10nId={'forwardButton'}
      class={'forwardButton'}
      isNav
      disabled={!this.props.canGoForward}
      swipePercent={this.props.swipeRightPercent}
      swipeOpacity={this.props.swipeRightOpacity}
      onClick={this.onForward}
      onLongPress={this.onForwardLongPress}
    >
      <svg width='12' height='14'>
        <g fill='none' fillRule='evenodd' transform='rotate(-180 6.5 7.5)'>
          <path className={css(styles.forwardButton__path)} d='M2.4266 8.312l8.756 5.373c.167.103.32.039.379.007.057-.032.192-.129.192-.327V2.619c0-.198-.135-.295-.192-.327-.057-.033-.21-.096-.379.008l-8.756 5.372c-.161.099-.179.257-.179.32s.018.221.179.32m8.951 6.681c-.293 0-.586-.081-.849-.243l-8.755-5.373h-.001c-.485-.298-.775-.815-.775-1.385 0-.569.29-1.087.775-1.385l8.757-5.373c.506-.312 1.122-.325 1.642-.033.521.291.832.821.832 1.418v10.746c0 .597-.311 1.127-.832 1.418-.25.14-.522.21-.794.21' />
        </g>
      </svg>
    </NavigationButton>
  }
}

const styles = StyleSheet.create({
  forwardButton__path: {
    fill: 'var(--icon-line-color)'
  }
})

module.exports = ReduxComponent.connect(ForwardButton)
