/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')

// Constants
const KeyCodes = require('../../../common/constants/keyCodes')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Styles
const globalStyles = require('../styles/global')
const shouldDebugWebviewEvents = false
const waitForFrame = () => new Promise(resolve => window.requestAnimationFrame(resolve))

async function forceDrawWebview (webview) {
  await waitForFrame()
  webview.style.visibility = 'hidden'
  await waitForFrame()
  webview.style.visibility = ''
  await waitForFrame()
}

class PopupWindow extends React.Component {
  constructor (props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
  }

  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown)

    if (this.props.src) {
      let webview = document.createElement('webview')
      webview.setAttribute('src', this.props.src)
      webview.setAttribute('name', 'browserAction')
      webview.addEventListener('crashed', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('destroyed', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('close', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('did-attach', () => {
        webview.enablePreferredSizeMode(true)
        if (this.isWalletPopup) {
          const height = 180
          const width = 280
          webview.style.height = height + 'px'
          webview.style.width = width + 'px'
          windowActions.setPopupWindowDetail(Immutable.fromJS({
            left: this.props.left,
            top: this.props.top,
            height,
            width,
            src: this.props.src
          }))
        }
        // Workaround first-draw blankness by forcing hide and show.
        if (!this.hasDrawn) {
          forceDrawWebview(webview)
          this.hasDrawn = true
        }
      })
      webview.addEventListener('load-start', () => {
        if (shouldDebugWebviewEvents) {
          console.log('load-start')
        }
      })
      webview.addEventListener('did-finish-load', () => {
        if (shouldDebugWebviewEvents) {
          console.log('did-finish-load')
        }
        windowActions.setPopupWindowLoaded()
      })
      webview.addEventListener('did-fail-load', () => {
        if (shouldDebugWebviewEvents) {
          console.log('did-fail-load')
        }
        windowActions.setPopupWindowLoaded()
      })
      webview.addEventListener('did-fail-provisional-load', () => {
        if (shouldDebugWebviewEvents) {
          console.log('did-fail-provisional-load')
        }
        windowActions.setPopupWindowLoaded()
      })
      webview.addEventListener('preferred-size-changed', () => {
        if (shouldDebugWebviewEvents) {
          console.log('preferred-size-changed')
        }
        if (this.isWalletPopup) {
          return
        }
        webview.getPreferredSize((preferredSize) => {
          const width = preferredSize.width
          const height = preferredSize.height
          webview.style.height = height + 'px'
          webview.style.width = width + 'px'

          windowActions.setPopupWindowDetail(Immutable.fromJS({
            left: this.props.left,
            top: this.props.top,
            height: height,
            width: width,
            src: this.props.src
          }))
        })
      })
      ReactDOM.findDOMNode(this).appendChild(webview)
    }
  }

  onKeyDown (e) {
    if (e.keyCode === KeyCodes.ESC) {
      windowActions.setPopupWindowDetail()
    }
  }

  get isWalletPopup () {
    return this.props.src && this.props.src.startsWith('chrome-extension://dakeiobolocmlkdebloniehpglcjkgcp/')
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const detail = currentWindow.get('popupWindowDetail', Immutable.Map())

    const props = {}
    // used in renderer
    props.width = parseInt(detail.get('width'))
    props.height = parseInt(detail.get('height'))
    props.top = parseInt(detail.get('top'))
    props.left = parseInt(detail.get('left'))
    props.loaded = detail.get('didFinishLoad')

    // used in other functions
    props.src = detail.get('src')

    return props
  }

  render () {
    let style = {}

    if (this.props.width) {
      style.width = this.props.width + 2
    }

    if (this.props.height) {
      style.height = this.props.height + 2
    }

    if (this.props.top) {
      if (this.props.top + this.props.height < window.innerHeight) {
        style.top = this.props.top
      } else {
        style.bottom = 0
      }
    }

    if (this.props.left) {
      if (this.props.left + this.props.width < window.innerWidth) {
        style.left = this.props.left
      } else {
        style.right = '1em'
      }
    }

    return <div
      data-popup-window
      className={css(
        styles.popupWindow,
        !this.props.loaded && styles.popupWindow_notLoaded,
        style.right !== undefined && styles.popupWindow_reverseExpand
      )}
      style={style} />
  }
}

module.exports = ReduxComponent.connect(PopupWindow)

const styles = StyleSheet.create({
  popupWindow: {
    border: `solid 1px ${globalStyles.color.gray}`,
    boxShadow: globalStyles.shadow.flyoutDialogBoxShadow,
    boxSizing: 'border-box',
    color: 'black',
    cursor: 'default',
    display: 'flex',
    fontSize: '11px',
    padding: 0,
    position: 'absolute',
    userSelect: 'none',
    overflowY: 'auto',
    zIndex: globalStyles.zindex.zindexPopupWindow
  },

  popupWindow_notLoaded: {
    opacity: 0
  },

  popupWindow_reverseExpand: {
    flexDirection: 'row-reverse'
  }
})
