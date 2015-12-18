/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const AppActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const uuid = require('node-uuid')

import adInfo from '../data/adInfo.js'
import Config from '../constants/config.js'

class Frame extends ImmutableComponent {
  constructor () {
    super()
  }

  get webview () {
    return ReactDOM.findDOMNode(this.refs.webview)
  }

  componentDidMount () {
    this.addEventListeners()
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
      case 'view-source':
        console.log('in view source')
        // TODO: Make sure this is a valid page to view source for
        let src = 'view-source:' + this.webview.getURL()
        AppActions.loadUrl(src)
        // TODO: Make the URL bar show the view-source: prefix
        break
    }
    if (activeShortcut) {
      AppActions.setActiveFrameShortcut(null)
    }
  }

  addEventListeners () {
    this.webview.addEventListener('new-window', (e) => {
      AppActions.newFrame({
        location: e.url
      })
    })
    this.webview.addEventListener('close', () => {
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
    })
    this.webview.addEventListener('page-favicon-updated', () => {
    })
    this.webview.addEventListener('page-title-set', ({title}) => {
      AppActions.setFrameTitle(this.props.frame, title)
    })
    this.webview.addEventListener('dom-ready', (event) => {
      this.insertAds(event.target.src)
    })
    this.webview.addEventListener('load-commit', (event) => {
      if (event.isMainFrame) {
        let key = this.props.frame.get('key')
        AppActions.setLocation(event.url, key)
      }
    })
    this.webview.addEventListener('did-start-loading', () => {
      AppActions.onWebviewLoadStart(
        this.props.frame)
    })
    this.webview.addEventListener('did-stop-loading', () => {
      AppActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
    })
    this.webview.addEventListener('did-fail-load', () => {
    })
    this.webview.addEventListener('did-finish-load', () => {
      AppActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
    })
  }

  insertAds (currentLocation) {
    let host = new window.URL(currentLocation).hostname.replace('www.', '')
    let adDivCandidates = adInfo[host]
    if (adDivCandidates) {
      // TODO: Use a real user ID and sessionID
      const userId = uuid.v4()
      const sessionId = uuid.v4()

      const placeholderUrl = Config.vault.replacementUrl(userId) + '?' + [
        `sessionId=${sessionId}`,
        `tagName=IFRAME`
      ].join('&')
      this.webview.send('set-ad-div-candidates', adDivCandidates, placeholderUrl)
    }
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
