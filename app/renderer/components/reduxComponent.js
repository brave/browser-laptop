const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('./immutableComponent')
const React = require('react')
const windowStore = require('../../../js/stores/windowStore')
const debounce = require('../../../js/lib/debounce')
const {isList, isSameHashCode} = require('../../common/state/immutableUtil')

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
    this.state = {}
    this.checkForUpdates = debounce(this.checkForUpdates.bind(this), 5)
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
    this.internalState = this.buildProps(this.props)
  }

  componentWillUnmount () {
    this.dontCheck = true
    appStore.removeChangeListener(this.checkForUpdates)
    windowStore.removeChangeListener(this.checkForUpdates)
  }

  componentDidUpdate () {
    this.internalState = this.buildProps(this.props)
  }

  checkParam (old, next, prop) {
    return isList(next[prop])
      ? !isSameHashCode(next[prop], old[prop])
      : next[prop] !== old[prop]
  }

  shouldComponentUpdate (nextProps, nextState) {
    nextState = this.buildProps(nextProps)
    return Object.keys(nextState).some((prop) => this.checkParam(this.internalState, nextState, prop))
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
    const component = React.createElement(ReduxComponent, Object.assign({componentType}, buildPropsImpl(props, componentType)))
    return component
  }
}
