/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('url').parse
const WindowActions = require('../actions/windowActions')
const AppActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet.js')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')
const messages = require('../constants/messages.js')
const remote = global.require('electron').remote

import adInfo from '../data/adInfo.js'
import Config from '../constants/config.js'
import FindBar from './findbar.js'
import { isSourceAboutUrl, getTargetAboutUrl } from '../lib/appUrlUtil.js'

class Frame extends ImmutableComponent {
  constructor () {
    super()
  }

  updateWebview () {
    let src = this.props.frame.get('src')
    const isAboutURL = isSourceAboutUrl(src)
    if (isAboutURL) {
      src = getTargetAboutUrl(src)
    }
    let contentScripts = ['content/webviewPreload.js']
    if (this.props.frame.get('location') === 'about:preferences') {
      contentScripts.push('content/aboutPreload.js')
    }
    contentScripts = contentScripts.join(',')

    const contentScriptsChanged =
      this.webview && contentScripts !== this.webview.getAttribute('contentScripts')

    // Create the webview dynamically because React doesn't whitelist all
    // of the attributes we need.  Clear out old webviews if the contentScripts
    // change because they cannot change after being added to the DOM.
    if (contentScriptsChanged) {
      while (this.webviewContainer.firstChild) {
        this.webviewContainer.removeChild(this.webviewContainer.firstChild)
      }
    }
    this.webview = !contentScriptsChanged && this.webview || document.createElement('webview')
    this.webview.setAttribute('allowDisplayingInsecureContent', true)
    this.webview.setAttribute('data-frame-key', this.props.frame.get('key'))
    this.webview.setAttribute('contentScripts', contentScripts)
    if (this.props.frame.get('isPrivate')) {
      this.webview.setAttribute('partition', 'private-1')
    } else if (this.props.frame.get('partitionNumber')) {
      this.webview.setAttribute('partition', `persist:partition-${this.props.frame.get('partitionNumber')}`)
    }
    if (this.props.frame.get('guestInstanceId')) {
      this.webview.setAttribute('data-guest-instance-id', this.props.frame.get('guestInstanceId'))
    }
    this.webview.setAttribute('src', src)
    if (!this.webviewContainer.firstChild) {
      this.webviewContainer.appendChild(this.webview)
      this.addEventListeners()
    }
  }

  componentDidMount () {
    this.updateWebview()
  }

  componentDidUpdate (prevProps, prevState) {
    const didSrcChange = this.props.frame.get('src') !== prevProps.frame.get('src')
    if (didSrcChange) {
      this.updateWebview()
    }
    // give focus when switching tabs
    if (this.props.isActive && !prevProps.isActive) {
      this.webview.focus()
    }
    const activeShortcut = this.props.frame.get('activeShortcut')
    switch (activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        if (this.props.frame.get('location') === 'about:preferences') {
          break
        }
        this.webview.reload()
        break
      case 'clean-reload':
        this.webview.reloadIgnoringCache()
        break
      case 'zoom-in':
        WindowActions.zoomIn(this.props.frame)
        break
      case 'zoom-out':
        WindowActions.zoomOut(this.props.frame)
        break
      case 'zoom-reset':
        WindowActions.zoomReset(this.props.frame)
        break
      case 'toggle-dev-tools':
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
        break
      case 'view-source':
        const src = UrlUtil.getViewSourceUrlFromUrl(this.webview.getURL())
        WindowActions.loadUrl(this.props.frame, src)
        // TODO: Make the URL bar show the view-source: prefix
        WindowActions.setFrameTitle(this.props.frame, src)
        break
      case 'save':
        // TODO: Sometimes this tries to save in a non-existent directory
        this.webview.downloadURL(this.webview.getURL())
        break
      case 'print':
        this.webview.print()
        break
      case 'show-findbar':
        WindowActions.setFindbarShown(this.props.frame, true)
        break
    }
    if (activeShortcut) {
      WindowActions.setActiveFrameShortcut(null)
    }

    if (this.props.frame.get('location') === 'about:preferences') {
      this.webview.send(messages.SETTINGS_UPDATED, this.props.settings.toJS())
    }
  }

  addEventListeners () {
    this.webview.addEventListener('focus', this.onFocus.bind(this))
    // @see <a href="https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md#event-new-window">new-window event</a>
    this.webview.addEventListener('new-window', (e, url, frameName, disposition, options) => {
      e.preventDefault()

      const guestInstanceId = e.options && e.options.webPreferences && e.options.webPreferences.guestInstanceId
      const windowOptions = e.options && e.options.windowOptions || {}
      windowOptions.parentWindowKey = remote.getCurrentWindow().id
      windowOptions.disposition = e.disposition

      if (e.disposition === 'new-window' || e.disposition === 'new-popup') {
        AppActions.newWindow({
          location: e.url,
          parentFrameKey: this.props.frame.get('key'),
          isPrivate: this.props.frame.get('isPrivate'),
          partitionNumber: this.props.frame.get('partitionNumber'),
          guestInstanceId
        }, windowOptions)
      } else {
        const openInForeground = this.props.prefOpenInForeground === true ||
          e.disposition !== 'background-tab'
        WindowActions.newFrame({
          location: e.url,
          parentFrameKey: this.props.frame.get('key'),
          isPrivate: this.props.frame.get('isPrivate'),
          partitionNumber: this.props.frame.get('partitionNumber'),
          guestInstanceId
        }, openInForeground)
      }
    })
    this.webview.addEventListener('destroyed', (e) => {
      WindowActions.closeFrame(this.props.frames, this.props.frame)
    })
    this.webview.addEventListener('close', () => {
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
      if (this.props.enableAds) {
        this.insertAds(event.target.src)
      }
    })
    const frame = this.props.frame
    this.webview.addEventListener('ipc-message', (e) => {
      let action = e.channel
      switch (action.actionType) {
        case messages.THEME_COLOR_COMPUTED:
          WindowActions.setThemeColor(frame, undefined, action.themeColor || null)
          break
      }
    })
    this.webview.addEventListener('load-commit', (event) => {
      if (event.isMainFrame) {
        // TODO: These 3 events should be combined into one
        WindowActions.onWebviewLoadStart(
          this.props.frame)
        const key = this.props.frame.get('key')
        WindowActions.setLocation(event.url, key)
        WindowActions.setSecurityState({
          secure: urlParse(event.url).protocol === 'https:'
          // TODO: Set extended validation once Electron exposes this
        })
      }
      WindowActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
    })
    this.webview.addEventListener('did-navigate', (e) => {
      // only give focus focus is this is not the initial default page load
      if (this.props.isActive && this.webview.canGoBack() && document.activeElement !== this.webview) {
        this.webview.focus()
      }
    })
    this.webview.addEventListener('did-start-loading', () => {
    })
    this.webview.addEventListener('did-stop-loading', () => {
    })
    this.webview.addEventListener('did-fail-load', () => {
    })
    this.webview.addEventListener('did-finish-load', () => {
    })
    this.webview.addEventListener('did-navigate-in-page', () => {
      WindowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
      this.webview.send(messages.POST_PAGE_LOAD_RUN)
    })
    this.webview.addEventListener('did-frame-finish-load', (event) => {
      if (event.isMainFrame) {
        WindowActions.onWebviewLoadEnd(
          this.props.frame,
          this.webview.getURL())
        this.webview.send(messages.POST_PAGE_LOAD_RUN)
      }
    })
    this.webview.addEventListener('media-started-playing', ({title}) => {
      WindowActions.setAudioPlaybackActive(this.props.frame, true)
    })
    this.webview.addEventListener('media-paused', ({title}) => {
      WindowActions.setAudioPlaybackActive(this.props.frame, false)
    })
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      WindowActions.setThemeColor(this.props.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.webview.addEventListener('found-in-page', (e) => {
      if (e.result !== undefined && e.result.matches !== undefined) {
        WindowActions.setFindDetail(this.props.frame, Immutable.fromJS({
          numberOfMatches: e.result.matches
        }))
      }
    })

    // Ensure we mute appropriately, the initial value could be set
    // from persisted state.
    if (this.props.frame.get('audioMuted')) {
      this.webview.setAudioMuted(true)
    }
  }

  insertAds (currentLocation) {
    const host = new window.URL(currentLocation).hostname.replace('www.', '')
    const adDivCandidates = adInfo[host] || []
    // Call this even when there are no matches because we have some logic
    // to replace common divs.
    this.webview.send(messages.SET_AD_DIV_CANDIDATES, adDivCandidates, Config.vault.replacementUrl)
  }

  goBack () {
    this.webview.goBack()
  }

  goForward () {
    this.webview.goForward()
  }

  onFocus () {
    WindowActions.setTabPageIndexByFrame(this.props.frame)
  }

  onFindHide () {
    WindowActions.setFindbarShown(this.props.frame, false)
    this.onClearMatch()
  }

  onFind (searchString, caseSensitivity, forward) {
    if (searchString) {
      this.webview.findInPage(searchString, {
        matchCase: caseSensitivity,
        forward: forward !== undefined ? forward : true,
        findNext: forward !== undefined
      })
    } else {
      this.onClearMatch()
    }
  }

  onClearMatch () {
    this.webview.stopFindInPage('clearSelection')
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') !== true) {
      this.webview.setAudioMuted(true)
    } else if (!nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') === true) {
      this.webview.setAudioMuted(false)
    }

    let zoomLevel = nextProps.frame.get('zoomLevel')
    if (zoomLevel !== this.props.frame.get('zoomLevel')) {
      this.webview.setZoomLevel(zoomLevel)
    }
  }

  render () {
    return <div
        className={cx({
          frameWrapper: true,
          isPreview: this.props.isPreview,
          isActive: this.props.isActive
        })}>
      <FindBar
        ref='findbar'
        onFind={this.onFind.bind(this)}
        onFindHide={this.onFindHide.bind(this)}
        active={this.props.frame.get('findbarShown')}
        frame={this.props.frame}
        findDetail={this.props.frame.get('findDetail')}
      />
      <div ref={node => this.webviewContainer = node}
        className={cx({
          webviewContainer: true,
          isPreview: this.props.isPreview
        })}/>
      { this.props.frame.get('hrefPreview')
        ? <div className={cx({
          hrefPreview: true,
          right: this.props.frame.get('showOnRight')
        })}>
          {this.props.frame.get('hrefPreview')}
        </div> : null
      }
    </div>
  }
}

module.exports = Frame
