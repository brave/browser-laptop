const React = require('react')
const ImmutableComponent = require('./immutableComponent')

// Actions
// const AppActions = require('../actions/appActions')

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')

class Main extends ImmutableComponent {
  render () {
    return <div id='browser'>
      <div>
        <NavigationBar
          navbar={this.props.browser.getIn(['ui', 'navbar'])}
          activeFrame={this.props.browser.get('frame')}
        />
      </div>
      <div className='mainContainer'>
        <div className='tabContainer'>
          <Frame frame={this.props.browser.get('frame')} />
        </div>
      </div>
    </div>
  }
}

module.exports = Main
