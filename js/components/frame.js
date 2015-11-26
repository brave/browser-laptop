const React = require('react')
const ImmutableComponent = require('./immutableComponent')

class Frame extends ImmutableComponent {
  render () {
    return <div className='frameWrapper'>
      <webview src={this.props.frame.get('location')} />
    </div>
  }
}

module.exports = Frame
