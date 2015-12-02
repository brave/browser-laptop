const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')
const ipc = require('ipc')

class UrlBar extends ImmutableComponent {
  constructor () {
    super()
    ipc.on('shortcut-focus-url', () => {
      this.select()
      this.focus()
    })
    ipc.on('shortcut-stop', () => {
      this.blur()
    })
  }

  focus () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.focus()
  }

  select () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.focus()
    urlInput.select()
  }

  blur () {
    let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
    urlInput.blur()
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        AppActions.loadUrl(this.props.urlbar.get('location'))
        this.blur()
        break
      case KeyCodes.ESC:
        e.preventDefault()
        this.blur()
        break
    }
  }

  onChange (e) {
    AppActions.setNavBarInput(e.target.value)
  }

  render () {
    return <form
        action='#'
        id='urlbar'
        ref='urlbar'>
      <input
        type='text'
        id='urlInput'
        ref='urlInput'
        value={this.props.urlbar.get('location')}
        onChange={this.onChange.bind(this)}
        onKeyDown={this.onKeyDown.bind(this)}/>
    </form>
  }
}

module.exports = UrlBar
