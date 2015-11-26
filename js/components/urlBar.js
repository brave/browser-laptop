const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')
const KeyCodes = require('../constants/keyCodes')

class UrlBar extends ImmutableComponent {
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
