const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')

class Button extends ImmutableComponent {
  render () {
    if (this.props.iconClass) {
      return <span disabled={this.props.disabled}
        className={cx({
          browserButton: true,
          fa: true,
          [this.props.iconClass]: true,
          [this.props.className]: true
        })}
        onClick={this.props.onClick}>
      </span>
    }
    return <span disabled={this.props.disabled} className='browserButton' onClick={this.props.onClick}>
      {this.props.label}
    </span>
  }
}

module.exports = Button
