const ipc = require('electron').ipcRenderer
const React = require('react')
const appStore = require('../../../js/stores/appStoreRenderer')
const ImmutableComponent = require('./immutableComponent')
const windowStore = require('../../../js/stores/windowStore')
const {isList, isSameHashCode} = require('../../common/state/immutableUtil')
const messages = require('../../../js/constants/messages')

// Memozing appState.set('currentWindow', windowState)
// is not so much for performance of this specific operation,
// but for the ability to equality check with the === operator
// inside component state selection, in order to very quickly
// check for each component if anything has changed.
// Otherwise each component would have a different state object (with the same properties)
// since, previously, we were appending currentWindow to appState for each component individually
// whenever either state changes.
function createMemoizeComponentState () {
  let lastAppState
  let lastWindowState
  let state
  return function getOrComputeCombinedState () {
    if (lastAppState !== appStore.state || lastWindowState !== windowStore.state) {
      state = appStore.state.set('currentWindow', windowStore.state)
      lastAppState = appStore.state
      lastWindowState = windowStore.state
    }
    return state
  }
}
const selectComponentState = createMemoizeComponentState()

const mergePropsImpl = (stateProps, ownProps) => {
  return Object.assign({}, stateProps, ownProps)
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
        const { totalTime, wastedTime, invocations } = toLog[componentName]
        toLogArray.push({ componentName, totalTime, wastedTime, invocations })
      }
      toLogArray.sort((a, b) => b.wastedTime - a.wastedTime)
      // get a pretty table in the format of: component-name : details
      toLog = { }
      for (const {componentName, totalTime, wastedTime, invocations} of toLogArray) {
        toLog[componentName] = { totalTime, wastedTime, invocations }
      }
      const totalBlockingTime = toLogArray.reduce((total, current) => total + current.totalTime, 0)
      const totalBlockingTimeWasted = toLogArray.reduce((total, current) => total + current.wastedTime, 0)
      // Log time spent, but only if there was time spent in mergeProps.
      // App may have been inactive and we don't want to log '0' every 10 seconds, if so.
      if (totalBlockingTime) {
        console.log(`MergeProps history over the last 10 seconds (total UI blocking time = ${totalBlockingTime}ms, wasted = ${totalBlockingTimeWasted}ms): `)
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
    this.state = this.buildProps(this.props, mergeStateToProps || mergePropsImpl)
    this.checkForUpdates = this.checkForUpdates.bind(this)
    this.dontCheck = true
  }

  checkForUpdates () {
    if (!this.dontCheck) {
      const t0 = isProfiling && window.performance.now()
      const newState = this.buildProps(this.props)
      const t1 = isProfiling && window.performance.now()
      const propsDidChange = didPropsChange(this.state, newState)
      // only set state on the component if properties are different
      if (propsDidChange) {
        this.setState(newState)
      }
      // log how much total time was taken, whether something changed or not,
      // so we can asses which Components mergeProps functions are taking the most time
      if (isProfiling) {
        const timeTaken = t1 - t0
        const componentName = this.componentType.name
        let componentMergePropsHistory = mergePropsComponentHistory[componentName]
        if (!componentMergePropsHistory) {
          componentMergePropsHistory = { totalTime: 0, invocations: 0, wastedTime: 0 }
          mergePropsComponentHistory[componentName] = componentMergePropsHistory
        }
        componentMergePropsHistory.invocations++
        componentMergePropsHistory.totalTime += timeTaken
        if (!propsDidChange) {
          // log total time used up in mergeProps where nothing changed
          mergePropsWasteMs += timeTaken
          // log component's wasted time separately
          componentMergePropsHistory.wastedTime += timeTaken
        }
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

  buildProps (props = this.props, mergeStateToProps) {
    // use memoized function which combines appState and windowState to help state equality checks
    // since map.set('a', 1) !== map.set('a', 1)
    // ...in other words, they have to actually be the same reference
    const appState = selectComponentState()
    // mergeStateToProps can be a function that returns a props object,
    // or a factory function which returns another function which then returns a props object
    // So the first time we run it, we may need to unwrap
    if (!this.mergeStateToProps) {
      // handle first run
      if (!mergeStateToProps) {
        throw new Error('No mergePropsToState function provided.')
      }
      // get initial result from fn
      let mergedProps = mergeStateToProps(appState, props)
      if (typeof mergedProps === 'function') {
        // provided function is a factory function,
        // so store the generated function and run it
        // to get the first result
        this.mergeStateToProps = mergedProps
        mergedProps = mergedProps(appState, props)
      } else {
        // provided function is simple
        this.mergeStateToProps = mergeStateToProps
      }
      // return first generated props
      return mergedProps
    } else {
      // handle non-first-run, run saved function to get latest props
      return this.mergeStateToProps(appState, props)
    }
  }

  render () {
    return React.createElement(this.componentType, this.state)
  }
}

module.exports.connect = (componentType, mergeStateToProps = componentType.prototype.mergeProps) => {
  return ReduxComponent.bind(null, componentType, mergeStateToProps)
}
