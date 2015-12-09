/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const AppActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')

class Frame extends ImmutableComponent {
  constructor () {
    super()
  }

  get webview () {
    return ReactDOM.findDOMNode(this.refs.webview)
  }

  componentDidUpdate () {
    const activeShortcut = this.props.frame.get('activeShortcut')
    switch (activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        this.webview.reload()
        break
      case 'zoom-in':
        this.webview.send('zoom-in')
        break
      case 'zoom-out':
        this.webview.send('zoom-out')
        break
      case 'zoom-reset':
        this.webview.send('zoom-reset')
        break
      case 'toggle-dev-tools':
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
        break
    }
    if (activeShortcut) {
      AppActions.setActiveFrameShortcut(null)
    }
  }

  componentDidMount () {
    this.webview.addEventListener('new-window', (e) => {
      console.log('new window: ' + e.url)
      AppActions.newFrame({
        location: e.url
      })
    })
    this.webview.addEventListener('close', () => {
      console.log('close window')
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
      console.log('enter html full screen')
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
      console.log('leave html full screen')
    })
    this.webview.addEventListener('page-favicon-updated', () => {
      console.log('favicon updated')
    })
    this.webview.addEventListener('page-title-set', ({title}) => {
      console.log('title set', title)
      AppActions.setFrameTitle(this.props.frame, title)
    })
    this.webview.addEventListener('dom-ready', () => {
      console.log('dom is ready')
    })
    this.webview.addEventListener('load-commit', (event) => {
      if (event.isMainFrame) {
        let key = this.props.frame.get('key')
        console.log('load committed', event.url, key)
        AppActions.setLocation(event.url, key)
      }
    })
    this.webview.addEventListener('did-start-loading', () => {
      console.log('spinner start loading')
      AppActions.onWebviewLoadStart(
        this.props.frame)
    })
    this.webview.addEventListener('did-stop-loading', () => {
      console.log('did stop loading')
      AppActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
    })
    this.webview.addEventListener('did-fail-load', () => {
      console.log('did fail load')
    })
    this.webview.addEventListener('did-finish-load', () => {
      console.log('did finish load')
      AppActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
    })
  }

  goBack () {
    this.webview.goBack()
  }

  goForward () {
    this.webview.goForward()
  }

  render () {
    return <div
        className={cx({
          frameWrapper: true,
          isActive: this.props.isActive
        })}>
      <webview
        ref='webview'
        src={this.props.frame.get('src')}
        preload='content/webviewPreload.js'/>
    </div>
  }
}

module.exports = Frame
