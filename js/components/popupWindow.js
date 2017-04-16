/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet')
const KeyCodes = require('../../app/common/constants/keyCodes')
const windowActions = require('../actions/windowActions')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')

/**
 * Represents a popup window
 */
class PopupWindow extends ImmutableComponent {
  componentWillMount () {
    this.width = this.props.detail.get('width')
    this.height = this.props.detail.get('height')
    this.top = this.props.detail.get('top')
    this.left = this.props.detail.get('left')
  }

  onKeyDown (e) {
    if (e.keyCode === KeyCodes.ESC) {
      windowActions.setPopupWindowDetail()
    }
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown.bind(this))
  }

  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    let src = this.props.detail.get('src')
    if (src) {
      let webview = document.createElement('webview')
      webview.setAttribute('src', src)
      webview.addEventListener('crashed', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('destroyed', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('close', () => {
        windowActions.setPopupWindowDetail()
      })
      let updateSize = () => {
        webview.getPreferredSize((preferredSize) => {
          let width = preferredSize.width
          let height = preferredSize.height
          if (width !== this.width || height !== this.height) {
            this.width = width
            this.height = height
            webview.style.height = height + 'px'
            webview.style.width = width + 'px'
            this.forceUpdate()
          }
        })
      }
      webview.addEventListener('did-attach', () => {
        webview.enablePreferredSizeMode(true)
      })
      webview.addEventListener('preferred-size-changed', (e) => {
        updateSize()
      })
      ReactDOM.findDOMNode(this).appendChild(webview)
    }
  }

  render () {
    let style = {}
    if (parseInt(this.width)) {
      style.width = this.width + 2
    }
    if (parseInt(this.height)) {
      style.height = this.height + 2
    }
    if (parseInt(this.top)) {
      if (this.top + this.height < window.innerHeight) {
        style.top = this.top
      } else {
        style.bottom = 0
      }
    }
    if (parseInt(this.left)) {
      if (this.left + this.width < window.innerWidth) {
        style.left = this.left
      } else {
        style.right = '1em'
      }
    }

    return <div
      className={cx({
        popupWindow: true,
        [css(styles.popupWindow)]: true,
        [css((style.right !== undefined) && styles.reverseExpand)]: true
      })}
      style={style} />
  }
}

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

module.exports = PopupWindow
