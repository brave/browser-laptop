const React = require('react')
const ReactDOM = require('react-dom')
const AppActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const ipc = global.require('electron').ipcRenderer
const cx = require('../lib/classSet.js')

class Frame extends ImmutableComponent {
  constructor () {
    super()
    ipc.on('shortcut-stop', () => {
      if (this.webview) {
        this.webview.stop()
      }
    })
    ipc.on('shortcut-reload', () => {
      if (this.webview) {
        this.webview.reload()
      }
    })
    ipc.on('shortcut-zoom-in', () => {
      if (this.webview) {
        this.webview.send('zoom-in')
      }
    })
    ipc.on('shortcut-zoom-out', () => {
      if (this.webview) {
        this.webview.send('zoom-out')
      }
    })
    ipc.on('shortcut-zoom-reset', () => {
      if (this.webview) {
        this.webview.send('zoom-reset')
      }
    })
    ipc.on('shortcut-toggle-dev-tools', () => {
      if (this.webview) {
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
      }
    })
    process.on('reload-active-frame', () => {
      if (this.props.isActive && this.webview) {
        this.webview.reload()
      }
    })
    process.on('stop-active-frame', () => {
      if (this.props.isActive && this.webview) {
        this.webview.stop()
      }
    })
  }

  get webview () {
    return ReactDOM.findDOMNode(this.refs.webview)
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
    this.webview.addEventListener('did-get-redirect-request', (oldUrl, newUrl) => {
      console.log('got redirect', newUrl)
      AppActions.setNavBarInput(newUrl)
    })
    this.webview.addEventListener('did-start-loading', () => {
      console.log('spinner start loading')
      AppActions.onWebviewLoadStart(
        this.props.frame)
    })
    this.webview.addEventListener('did-stop-loading', () => {
      console.log('spinner stop loading')
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
        src={this.props.frame.get('location')}
        preload='content/webviewPreload.js'/>
    </div>
  }
}

module.exports = Frame
