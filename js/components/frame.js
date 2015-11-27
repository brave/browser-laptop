const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const ipc = require('ipc')
const cx = require('../lib/classSet.js')

class Frame extends ImmutableComponent {
  constructor () {
    super()
    ipc.on('shortcut-stop', () => {
      let webview = ReactDOM.findDOMNode(this.refs.webview)
      if (webview) {
        webview.stop()
      }
    })
    ipc.on('shortcut-reload', () => {
      let webview = ReactDOM.findDOMNode(this.refs.webview)
      if (webview) {
        webview.reload()
      }
    })
  }

  componentDidMount () {
    let webview = ReactDOM.findDOMNode(this.refs.webview)
    webview.addEventListener('new-window', (e) => {
      console.log('new window: ' + e.url)
    })
    webview.addEventListener('close', () => {
      console.log('close window')
    })
    webview.addEventListener('enter-html-full-screen', () => {
      console.log('enter html full screen')
    })
    webview.addEventListener('leave-html-full-screen', () => {
      console.log('leave html full screen')
    })
    webview.addEventListener('page-favicon-updated', () => {
      console.log('favicon updated')
    })
    webview.addEventListener('page-title-set', () => {
      console.log('title set')
    })
    webview.addEventListener('dom-ready', () => {
      console.log('dom is ready')
    })
    webview.addEventListener('did-start-loading', () => {
      console.log('spinner start loading')
    })
    webview.addEventListener('did-stop-loading', () => {
      console.log('spinner stop loading')
    })
    webview.addEventListener('did-stop-loading', () => {
      console.log('did stop loading')
    })
    webview.addEventListener('did-fail-load', () => {
      console.log('did fail load')
    })
    webview.addEventListener('did-finish-load', () => {
      console.log('did finish load')
    })
  }

  render () {
    return <div
        className={cx({
          frameWrapper: true,
          isActive: this.props.isActive
        })}>
      <webview ref='webview' src={this.props.frame.get('location')} />
    </div>
  }
}

module.exports = Frame
