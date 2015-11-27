const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const AppActions = require('../actions/appActions')

// Actions
// const AppActions = require('../actions/appActions')

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')

class Main extends ImmutableComponent {
  componentDidMount () {
    if (this.props.browser.get('frames').isEmpty()) {
      AppActions.newFrame({
        location: 'http://brave.com'
      })
    }
  }

  render () {
    const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
      ? 1 : b.get('key') > a.get('key') ? -1 : 0

    return <div id='browser'>
      <div>
        <NavigationBar
          navbar={this.props.browser.getIn(['ui', 'navbar'])}
          activeFrame={this.props.browser.get('frame')}
        />
      </div>
      <div className='mainContainer'>
        <div className='tabContainer'>
        {
          this.props.browser.get('frames').sort(comparatorByKeyAsc).map(frame =>
            <Frame
              frame={frame}
              key={frame.get('key')}
            />)
        }
        </div>
      </div>
    </div>
  }
}

module.exports = Main
