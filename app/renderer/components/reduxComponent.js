const ipc = require('electron').ipcRenderer
const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('./immutableComponent')
const React = require('react')
const windowStore = require('../../../js/stores/windowStore')
const {isList, isSameHashCode} = require('../../common/state/immutableUtil')
const messages = require('../../../js/constants/messages')

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

let isProfiling = false
let perfRunningIntervalWastedTime = null
let perfRunningIntervalMergePropsHistory = null
let mergePropsWasteMs = 0
let mergePropsComponentHistory = { }
ipc.on(messages.DEBUG_REACT_PROFILE, (e, args) => {
  if (!isProfiling) {
    isProfiling = true
    let totalMergePropsWaste = 0

    const logMergePropsWaste = function () {
      const timeWasted = mergePropsWasteMs
      if (timeWasted) {
        mergePropsWasteMs = 0
        totalMergePropsWaste += timeWasted
        console.log(`wasted ${timeWasted}ms in the last 1 second performing mergeProps that did not change, now wasted a total of ${totalMergePropsWaste}ms`)
      }
    }
    const logMergePropsHistory = function () {
      let toLog = mergePropsComponentHistory
      mergePropsComponentHistory = { }
      // sort by time taken
      let toLogArray = []
      for (const componentName in toLog) {
        const { totalTime, invocations } = toLog[componentName]
        toLogArray.push({ componentName, totalTime, invocations })
      }
      toLogArray.sort((a, b) => b.totalTime - a.totalTime)
      // get a pretty table in the format of: component-name : details
      toLog = { }
      for (const {componentName, totalTime, invocations} of toLogArray) {
        toLog[componentName] = { totalTime, invocations }
      }
      const totalBlockingTime = toLogArray.reduce((total, current) => total + current.totalTime, 0)
      // Log time spent, but only if there was time spent in mergeProps.
      // App may have been inactive and we don't want to log '0' every 10 seconds, if so.
      if (totalBlockingTime) {
        console.log(`MergeProps history over the last 10 seconds (total UI blocking time = ${totalBlockingTime}ms): `)
        console.table(toLog)
      }
    }
    perfRunningIntervalWastedTime = setInterval(logMergePropsWaste, 1000)
    perfRunningIntervalMergePropsHistory = setInterval(logMergePropsHistory, 10000)
  } else {
    window.clearInterval(perfRunningIntervalWastedTime)
    window.clearInterval(perfRunningIntervalMergePropsHistory)
    isProfiling = false
    mergePropsWasteMs = null
  }
})

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
      const t0 = isProfiling && window.performance.now()
      const newState = this.buildProps(this.props)
      const t1 = isProfiling && window.performance.now()
      if (didPropsChange(this.state, newState)) {
        this.setState(newState)
      } else if (isProfiling) {
        // log time used up in mergeProps where nothing changed
        const timeTaken = t1 - t0
        mergePropsWasteMs += timeTaken
      }
      // log how much total time was taken, whether something changed or not,
      // so we can asses which Components mergeProps functions are taking the most time
      if (isProfiling) {
        const componentName = this.componentType.name
        let componentMergePropsHistory = mergePropsComponentHistory[componentName]
        if (!componentMergePropsHistory) {
          componentMergePropsHistory = { totalTime: 0, invocations: 0 }
          mergePropsComponentHistory[componentName] = componentMergePropsHistory
        }
        componentMergePropsHistory.invocations++
        componentMergePropsHistory.totalTime += (t1 - t0)
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
