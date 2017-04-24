const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('./immutableComponent')
const React = require('react')
const windowStore = require('../../../js/stores/windowStore')

const mergePropsImpl = (stateProps, dispatchProps, ownProps) => {
  return Object.assign({}, stateProps, dispatchProps, ownProps)
}

const buildPropsImpl = (props, componentType) => {
  const fn = componentType.prototype.mergeProps || mergePropsImpl
  const state = appStore.state.set('currentWindow', windowStore.state)
  return fn(state, {}, props)
}

class ReduxComponent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.componentType = props.componentType
    this.state = buildPropsImpl(props, this.componentType)
    this.checkForUpdates = this.checkForUpdates.bind(this)
    this.dontCheck = false
  }

  checkForUpdates () {
    if (!this.dontCheck && this.shouldComponentUpdate(this.props, this.buildProps())) {
      this.forceUpdate()
    }
  }

  componentDidMount () {
    appStore.addChangeListener(this.checkForUpdates)
    windowStore.addChangeListener(this.checkForUpdates)
  }

  componentWillUnmount () {
    this.dontCheck = true
    appStore.removeChangeListener(this.checkForUpdates)
    windowStore.removeChangeListener(this.checkForUpdates)
  }

  componentWillReceiveProps (nextProps) {
    this.setState(this.buildProps(nextProps))
  }

  shouldComponentUpdate (nextProps, nextState) {
    return Object.keys(nextState).some((prop) => nextState[prop] !== this.state[prop]) ||
      Object.keys(nextProps).some((prop) => nextProps[prop] !== this.props[prop])
  }

  mergeProps (stateProps, dispatchProps, ownProps) {
    return mergePropsImpl(stateProps, dispatchProps, ownProps)
  }

  buildProps (props = this.props) {
    return buildPropsImpl(props, this.componentType)
  }

  render () {
    return React.createElement(this.componentType, this.buildProps())
  }
}

module.exports.connect = (componentType) => {
  return (props) => {
    const component = React.createElement(ReduxComponent, Object.assign({componentType}, props))
    return component
  }
}
