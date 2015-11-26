const React = require('react')
const Immutable = require('immutable')

class ImmutableComponent extends React.Component {
  shouldComponentUpdate (nextProps, nextState) {
    return Object.keys(nextProps).some(prop => !Immutable.is(nextState, this.props[prop]))
  }
}

module.exports = ImmutableComponent
