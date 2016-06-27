/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const windowActions = require('../actions/windowActions')

/**
 * Represents a popup window
 */
class PopupWindow extends ImmutableComponent {

  componentDidMount () {
    let src = this.props.detail.get('src')
    if (src) {
      let webview = document.createElement('webview')
      webview.setAttribute('src', src)
      if (parseInt(this.props.detail.get('height'))) {
        console.log('got height')
        webview.style.height = this.props.detail.get('height') + 'px'
      }
      if (parseInt(this.props.detail.get('width'))) {
        webview.style.width = this.props.detail.get('width') + 'px'
      }
      webview.addEventListener('destroyed', () => {
        windowActions.setPopupWindowDetail()
      })
      webview.addEventListener('close', () => {
        windowActions.setPopupWindowDetail()
      })
      ReactDOM.findDOMNode(this).appendChild(webview)
    }
  }

  render () {
    const styles = {}
    if (parseInt(this.props.detail.get('left'))) {
      styles.left = this.props.detail.get('left')
    }
    if (parseInt(this.props.detail.get('right'))) {
      styles.right = this.props.detail.get('right')
    }
    if (parseInt(this.props.detail.get('top'))) {
      styles.top = this.props.detail.get('top')
    }
    if (parseInt(this.props.detail.get('bottom'))) {
      styles.bottom = this.props.detail.get('bottom')
    }
    if (parseInt(this.props.detail.get('height'))) {
      styles.height = this.props.detail.get('height') + 2
    }
    if (parseInt(this.props.detail.get('width'))) {
      styles.width = this.props.detail.get('width') + 2
    }
    if (parseInt(this.props.detail.get('minHeight'))) {
      styles.minHeight = this.props.detail.get('minHeight') + 2
    }
    if (parseInt(this.props.detail.get('maxHeight'))) {
      styles.maxHeight = this.props.detail.get('maxHeight') + 2
    }

    return <div
      className={cx({
        popupWindow: true,
        reverseExpand: this.props.detail.get('right') !== undefined
      })}
      style={styles}>
    </div>
  }
}

module.exports = PopupWindow
