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
      })
      webview.addEventListener('preferred-size-changed', () => {
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

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const detail = currentWindow.get('popupWindowDetail', Immutable.Map())

    const props = {}
    // used in renderer
    props.width = parseInt(detail.get('width'))
    props.height = parseInt(detail.get('height'))
    props.top = parseInt(detail.get('top'))
    props.left = parseInt(detail.get('left'))

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
      className={css(
        styles.popupWindow,
        style.right !== undefined && styles.reverseExpand
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
    zIndex: globalStyles.zindex.zindexPopupWindow
  },
  reverseExpand: {
    flexDirection: 'row-reverse'
  }
})
