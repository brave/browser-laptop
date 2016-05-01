/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')

/**
 * Represents a popup window
 */
export default class PopupWindow extends ImmutableComponent {

  componentDidMount () {
    let src = this.props.detail.get('src')
    if (src) {
      let webview = document.createElement('webview')
      webview.setAttribute('src', src)
      ReactDOM.findDOMNode(this).appendChild(webview)
    }
  }

  render () {
    const styles = {}
    if (this.props.detail.get('left') !== undefined) {
      styles.left = this.props.detail.get('left')
    }
    if (this.props.detail.get('right') !== undefined) {
      styles.right = this.props.detail.get('right')
    }
    if (this.props.detail.get('top') !== undefined) {
      styles.top = this.props.detail.get('top')
    }
    if (this.props.detail.get('bottom') !== undefined) {
      styles.bottom = this.props.detail.get('bottom')
    }
    if (this.props.detail.get('width') !== undefined) {
      styles.width = this.props.detail.get('width')
    }
    if (this.props.detail.get('minHeight')) {
      styles.minHeight = this.props.detail.get('minHeight')
    }
    if (this.props.detail.get('maxHeight')) {
      styles.maxHeight = this.props.detail.get('maxHeight')
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
