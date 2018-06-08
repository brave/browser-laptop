/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
// comment out to not use pooled webview (2x webviews):
const WebviewDisplay = require('../../pooledWebviewDisplay')
// uncomment in to use 1x webview (for debugging):
// const WebviewDisplay = require('../../webviewDisplay')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const tabActions = require('../../../common/actions/tabActions')

// state
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// constants
const settings = require('../../../../js/constants/settings')

// utils
const {getCurrentWindowId, isFocused} = require('../../currentWindow')
const {getSetting} = require('../../../../js/settings')

class GuestInstanceRenderer extends React.Component {
  constructor (props) {
    super(props)
    this.setWebviewRef = this.setWebviewRef.bind(this)
  }

  mergeProps (state, ownProps) {
    const frameKey = ownProps.frameKey
    const frame = frameStateUtil.getFrameByKey(state.get('currentWindow'), frameKey)
    const location = frame && frame.get('location')
    const frameIsInWindow = frame && frame.get('tabStripWindowId') === getCurrentWindowId()

    const props = {
      displayDebugInfo: getSetting(settings.DEBUG_VERBOSE_TAB_INFO),
      debugTabEvents: state.getIn(['currentWindow', 'debugTabEvents']),
      activeFrameKey: state.getIn(['currentWindow', 'activeFrameKey']),
      guestInstanceId: frame && frame.get('guestInstanceId'),
      tabId: frame && frame.get('tabId'),
      isDefaultNewTabLocation: location === 'about:newtab',
      isBlankLocation: location === 'about:blank',
      isPlaceholder: frame && frame.get('isPlaceholder'),
      windowIsFocused: isFocused(state),
      frameKey,
      frameIsInWindow,
      frameLocation: frame && frame.get('location'),
      urlBarFocused: frame && frame.getIn(['navbar', 'urlbar', 'focused'])
    }
    return props
  }

  componentDidMount () {
    this.onPropsChanged()
  }

  componentDidUpdate (prevProps, prevState) {
    this.onPropsChanged(prevProps)
  }

  debugLog (...messages) {
    if (this.props.debugTabEvents) {
      console.log(...messages)
    }
  }

  getReadyToAttachTabId (props = {}) {
    return props.frameIsInWindow && props.tabId
  }

  onPropsChanged (prevProps = {}) {
    // attach new guest instance
    this.webviewDisplay.shouldLogEvents = this.props.debugTabEvents
    const toAttachTabId = this.getReadyToAttachTabId(this.props)
    const lastAttachTabId = this.getReadyToAttachTabId(prevProps)
    if (this.webviewDisplay && toAttachTabId && lastAttachTabId !== toAttachTabId) {
      this.debugLog('guestInstanceRenderer, attach tab', toAttachTabId, 'guest', this.props.guestInstanceId, this.props.isPlaceholder)
      if (!this.props.isPlaceholder) {
        this.webviewDisplay.attachActiveTab(this.props.tabId)
      } else if (this.props.debugTabEvents) {
        this.debugLog('placeholder, not showing')
      }
    }
    this.webviewDisplay.debugTabEvents = this.props.debugTabEvents
    // update state of which frame is currently being viewed
    if (this.props.tabId !== prevProps.tabId && this.props.windowIsFocused) {
      windowActions.setFocusedFrame(this.props.frameLocation, this.props.tabId)
    }
    if (this.props.tabId !== prevProps.tabId && !this.props.urlBarFocused) {
      webviewActions.setWebviewFocused()
    }
  }

  setWebviewRef (containerElement) {
    // first time, create the webview
    if (containerElement && !this.webviewDisplay) {
      this.webviewDisplay = new WebviewDisplay({
        containerElement,
        classNameWebview: css(styles.guestInstanceRenderer__webview),
        classNameWebviewAttached: css(styles.guestInstanceRenderer__webview_attached),
        classNameWebviewAttaching: css(styles.guestInstanceRenderer__webview_attaching),
        onZoomChange: this.onUpdateZoom.bind(this),
        onFocus: this.onFocus.bind(this)
      })
      webviewActions.init(this.webviewDisplay)
      // treat the container as main frame position for mouse position
      containerElement.addEventListener('mouseenter', (e) => {
        windowActions.onFrameMouseEnter()
      }, { passive: true })
      containerElement.addEventListener('mouseleave', (e) => {
        windowActions.onFrameMouseLeave()
      }, { passive: true })
    }
  }

  onFocus () {
    if (this.props.tabId !== null) {
      windowActions.setTabPageIndexByFrame(this.props.tabId)
      windowActions.tabOnFocus(this.props.tabId)
    }
  }

  onUpdateZoom (zoomPercent) {
    // TODO: better to respond to a muon Tab event `zoom-changed` via ZoomObserver
    // if that is provided in the future
    tabActions.zoomChanged(this.props.tabId, zoomPercent)
  }

  render () {
    const debugInfo = this.props.displayDebugInfo
      ? `WindowId: ${getCurrentWindowId()}, TabId: ${this.props.tabId}, GuestId: ${this.props.guestInstanceId}, FrameKey: ${this.props.frameKey}, guestIsReady: ${this.props.guestIsReady}, frameIsInWindow: ${this.props.frameIsInWindow}, activeFrameKey: ${this.props.activeFrameKey}, windowIsFocused: ${this.props.windowIsFocused}`
      : null
    return (
      <div
        className={css(
          styles.guestInstanceRenderer,
          this.props.isDefaultNewTabLocation && styles.guestInstanceRenderer_isDefaultNewTabLocation,
          this.props.isBlankLocation && styles.guestInstanceRenderer_isBlankLocation,
          this.props.displayDebugInfo && styles.guestInstanceRenderer_visualDebug
        )}
        data-debuginfo={debugInfo}
        ref={this.setWebviewRef}
      />
    )
  }
}

const styles = StyleSheet.create({
  guestInstanceRenderer: {
    display: 'flex',
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    // default frame background
    // TODO: use theme.frame.defaultBackground
    '--frame-bg': '#fff'
  },

  guestInstanceRenderer_isDefaultNewTabLocation: {
    // matches tab dashboard background
    // will also show when about:newtab === about:blank or is Private Tab
    // TODO: use theme.frame.newTabBackground
    '--frame-bg': '#222'
  },

  guestInstanceRenderer_isBlankLocation: {
  },

  guestInstanceRenderer_visualDebug: {
    ':after': {
      zIndex: '20',
      content: 'attr(data-debuginfo)',
      position: 'absolute',
      padding: '5px',
      background: '#111',
      color: 'white',
      fontSize: '12px',
      border: '1px dashed white'
    }
  },

  guestInstanceRenderer__webview: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'var(--frame-bg)',
    border: 0,
    outline: 'none'
  },

  guestInstanceRenderer__webview_attached: {
    zIndex: 20
  },

  guestInstanceRenderer__webview_attaching: {
    // only show the active webview when it is attached, reducing white flash
    zIndex: 15
  }
})

module.exports = ReduxComponent.connect(GuestInstanceRenderer)
