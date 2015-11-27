const React = require('react')
const ReactDOM = require('react-dom')

const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')
const ipc = require('ipc')

class UrlBar extends ImmutableComponent {
  constructor() {
    super()
    ipc.on('shortcut-focus-url', () => {
      let urlInput = ReactDOM.findDOMNode(this.refs.urlInput)
      urlInput.select()
      urlInput.focus()
    });
  }

  onKeyDown (e) {
    switch (e.keyCode) {
      case KeyCodes.ENTER:
        e.preventDefault()
        AppActions.loadUrl(this.props.urlbar.get('location'));
        break;
    }
  }

  onChange(e) {
    AppActions.setNavBarInput(e.target.value);
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
