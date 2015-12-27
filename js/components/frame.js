/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const WindowActions = require('../actions/windowActions')
const AppActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')
const messages = require('../constants/messages.js')
const remote = global.require('electron').remote

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

  componentDidUpdate (prevProps, prevState) {
    if ((this.props.isActive && !prevProps.isActive && !this.props.frame.getIn(['navbar', 'urlbar', 'focused'])) ||
        (this.props.isActive && this.props.frame.get('src') !== prevProps.frame.get('src'))) {
      this.webview.focus()
    }

    const activeShortcut = this.props.frame.get('activeShortcut')
    switch (activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        this.webview.reload()
        break
      case 'clean-reload':
        this.webview.reloadIgnoringCache()
        break
      case 'zoom-in':
        this.webview.send(messages.ZOOM_IN)
        break
      case 'zoom-out':
        this.webview.send(messages.ZOOM_OUT)
        break
      case 'zoom-reset':
        this.webview.send(messages.ZOOM_RESET)
        break
      case 'toggle-dev-tools':
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
        break
      case 'view-source':
        let src = UrlUtil.getViewSourceUrlFromUrl(this.webview.getURL())
        WindowActions.loadUrl(src)
        // TODO: Make the URL bar show the view-source: prefix
        break
      case 'save':
        // TODO: Sometimes this tries to save in a non-existent directory
        remote.getCurrentWebContents().downloadURL(this.webview.getURL())
        break
      case 'print':
        this.webview.send(messages.PRINT_PAGE)
        break
    }
    if (activeShortcut) {
      WindowActions.setActiveFrameShortcut(null)
    }
  }

  addEventListeners () {
    // @see <a href="https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md#event-new-window">new-window event</a>
    this.webview.addEventListener('new-window', (e) => {
      // TODO handle _top, _parent and named frames
      // also popup blocking and security restrictions!!

      // @see <a href="http://www.w3.org/TR/html5/browsers.html#dom-open">dom open</a>
      // @see <a href="http://www.w3.org/TR/html-markup/datatypes.html#common.data.browsing-context-name-or-keyword">browsing context name or keyword</a>
      if (e.frameName.toLowerCase() === '_self') {
        WindowActions.loadUrl(e.url)
      } else if (e.disposition === 'new-window' || e.frameName.toLowerCase() === '_blank') {
        AppActions.newWindow({
          location: e.url,
          parentFrameKey: this.props.frame.get('key'),
          parentWindowKey: remote.getCurrentWindow().id
        }, e.options)
      } else {
        WindowActions.newFrame({
          location: e.url,
          parentFrameKey: this.props.frame.get('key'),
          parentWindowKey: remote.getCurrentWindow().id,
          openInForeground: e.disposition !== 'background-tab'
        })
      }
    })
    this.webview.addEventListener('close', () => {
      // security restrictions here?
      AppActions.closeWindow(remote.getCurrentWindow().id)
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
    })
    this.webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        WindowActions.setFavicon(this.props.frame, e.favicons[0])
      }
    })
    this.webview.addEventListener('page-title-set', ({title}) => {
      WindowActions.setFrameTitle(this.props.frame, title)
    })
    this.webview.addEventListener('dom-ready', (event) => {
      this.insertAds(event.target.src)
    })
    this.webview.addEventListener('load-commit', (event) => {
      if (event.isMainFrame) {
        let key = this.props.frame.get('key')
        WindowActions.setLocation(event.url, key)
      }
      WindowActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
    })
    this.webview.addEventListener('did-start-loading', () => {
      WindowActions.onWebviewLoadStart(
        this.props.frame)
    })
    this.webview.addEventListener('did-stop-loading', () => {
      WindowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
    })
    this.webview.addEventListener('did-fail-load', () => {
    })
    this.webview.addEventListener('did-finish-load', () => {
    })
    this.webview.addEventListener('media-started-playing', ({title}) => {
      WindowActions.setAudioPlaybackActive(this.props.frame, true)
    })
    this.webview.addEventListener('media-paused', ({title}) => {
      WindowActions.setAudioPlaybackActive(this.props.frame, false)
    })
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      WindowActions.setThemeColor(this.props.frame, themeColor)
    })

    // Ensure we mute appropriately, the initial value could be set
    // from persisted state.
    if (this.props.frame.get('audioMuted')) {
      this.webview.setAudioMuted(true)
    }
  }

  insertAds (currentLocation) {
    let host = new window.URL(currentLocation).hostname.replace('www.', '')
    let adDivCandidates = adInfo[host]
    if (adDivCandidates) {
      this.webview.send(messages.SET_AD_DIV_CANDIDATES,
                        adDivCandidates, Config.vault.replacementUrl)
    }
  }

  goBack () {
    this.webview.goBack()
  }

  goForward () {
    this.webview.goForward()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') !== true) {
      this.webview.setAudioMuted(true)
    } else if (!nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') === true) {
      this.webview.setAudioMuted(false)
    }
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
