const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('./immutableComponent')
const React = require('react')
const windowStore = require('../../../js/stores/windowStore')
const {isList, isSameHashCode} = require('../../common/state/immutableUtil')

const mergePropsImpl = (stateProps, ownProps) => {
  return Object.assign({}, stateProps, ownProps)
}

const buildPropsImpl = (props, componentType, mergeStateToProps) => {
  const fn = mergeStateToProps || mergePropsImpl
  const state = appStore.state.set('currentWindow', windowStore.state)
  return fn(state, props)
}

const checkParam = function (old, next, prop) {
  return isList(next[prop])
    ? !isSameHashCode(next[prop], old[prop])
    : next[prop] !== old[prop]
}

const didPropsChange = function (oldProps, newProps) {
  let checked = {}
  const oldKeys = Object.keys(oldProps)
  for (let prop of oldKeys) {
    if (checkParam(oldProps, newProps, prop)) {
      return true
    } else {
      checked[prop] = true
    }
  }
  const newKeys = Object.keys(newProps)
  for (let prop of newKeys) {
    if (!checked[prop] && checkParam(oldProps, newProps, prop)) {
      return true
    }
  }
  return false
}

class ReduxComponent extends ImmutableComponent {
  constructor (componentType, mergeStateToProps, props) {
    super(props)
    this.componentType = componentType
    this.mergeStateToProps = mergeStateToProps
    this.state = this.buildProps(this.props)
    this.checkForUpdates = this.checkForUpdates.bind(this)
    this.dontCheck = true
  }

  checkForUpdates () {
    if (!this.dontCheck) {
      const newState = this.buildProps(this.props)
      if (didPropsChange(this.state, newState)) {
        this.setState(newState)
      }
    }
  }

  componentDidMount () {
    this.dontCheck = false
    appStore.addChangeListener(this.checkForUpdates)
    windowStore.addChangeListener(this.checkForUpdates)
  }

  componentWillUnmount () {
    this.dontCheck = true
    appStore.removeChangeListener(this.checkForUpdates)
    windowStore.removeChangeListener(this.checkForUpdates)
  }

  componentWillReceiveProps (nextProps) {
    if (didPropsChange(this.props, nextProps)) {
      this.setState(this.buildProps(nextProps))
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    // we only update the state when it actually changes so this can be a simple equality check
    return this.state !== nextState
  }

  mergeProps (stateProps, ownProps) {
    return mergePropsImpl(stateProps, ownProps)
  }

  buildProps (props = this.props) {
    return buildPropsImpl(props, this.componentType, this.mergeStateToProps)
  }

  render () {
    return React.createElement(this.componentType, this.state)
  }
}

module.exports.connect = (componentType, mergeStateToProps = componentType.prototype.mergeProps) => {
  return ReduxComponent.bind(null, componentType, mergeStateToProps)
}
