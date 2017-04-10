const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const React = require('react')
const windowStore = require('../../../js/stores/windowStore')

class ReduxComponent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.componentType = props.componentType
  }

  componentDidMount () {
    appStore.addChangeListener(() => {
      if (this.shouldComponentUpdate(this.buildProps(), this.state)) {
        this.forceUpdate()
      }
    })

    windowStore.addChangeListener(() => {
      if (this.shouldComponentUpdate(this.buildProps(), this.state)) {
        this.forceUpdate()
      }
    })
  }

  shouldComponentUpdate (nextProps, nextState) {
    return super.shouldComponentUpdate(this.buildProps(nextProps), nextState)
  }

  mergeProps (stateProps, dispatchProps, ownProps) {
    return Object.assign({}, stateProps, dispatchProps, ownProps)
  }

  buildProps (props = this.props) {
    const fn = this.componentType.prototype.mergeProps || this.mergeProps
    const state = appStore.state.set('currentWindow', windowStore.state)
    return fn(state, {}, props)
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
