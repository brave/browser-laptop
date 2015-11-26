const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')
const UrlBar = require('./urlBar')

class NavigationBar extends ImmutableComponent {
  render () {
    return <div id='navigator'>
      <UrlBar
        urlbar={this.props.navbar.get('urlbar')}
        activeFrame={this.props.activeFrame}
      />
    </div>
  }
}

module.exports = NavigationBar
