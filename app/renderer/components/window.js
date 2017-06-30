/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Controller view which manages the top level immutable state for the app

const React = require('react')
const PropTypes = require('prop-types')
const Immutable = require('immutable')

// Components
const Main = require('./main/main')

// Stores
const windowStore = require('../../../js/stores/windowStore')
const appStoreRenderer = require('../../../js/stores/appStoreRenderer')

// Actions
const windowActions = require('../../../js/actions/windowActions')
const appActions = require('../../../js/actions/appActions')

// Utils
const cx = require('../../../js/lib/classSet')
const {getPlatformStyles} = require('../../common/lib/platformUtil')
const {getCurrentWindowId} = require('../currentWindow')

window.appActions = appActions

class Window extends React.Component {
  constructor (props) {
    super(props)
    // initialize appState from props
    // and then listen for updates
    this.appState = appStoreRenderer.state
    this.windowState = Immutable.fromJS(this.props.initWindowState) || windowStore.getState()
    this.state = {
      immutableData: {
        windowState: this.windowState,
        appState: this.appState
      }
    }
    if (this.props.initWindowState) {
      windowActions.setState(this.windowState)
    }

    this.onChange = this.onChange.bind(this)
    this.onAppStateChange = this.onAppStateChange.bind(this)
    windowStore.addChangeListener(this.onChange)
    appStoreRenderer.addChangeListener(this.onAppStateChange)
  }

  componentWillMount () {
    const activeFrameKey = this.state.immutableData.windowState.get('activeFrameKey')
    this.props.frames.forEach((frame, i) => {
      if (frame.guestInstanceId) {
        appActions.newWebContentsAdded(getCurrentWindowId(), frame)
      } else {
        appActions.createTabRequested({
          url: frame.location || frame.src || frame.provisionalLocation,
          partitionNumber: frame.partitionNumber,
          isPrivate: frame.isPrivate,
          active: activeFrameKey ? frame.key === activeFrameKey : true,
          discarded: frame.unloaded,
          title: frame.title,
          faviconUrl: frame.icon,
          index: i
        }, false, true /* isRestore */)
      }
    })
  }

  render () {
    let classes = {}
    classes['windowContainer'] = true

    const platformClasses = getPlatformStyles()
    platformClasses.forEach((className) => {
      classes[className] = true
    })

    // Windows puts a 1px border around frameless window
    // For Windows 10, this defaults to blue. When window
    // becomes inactive it needs to change to gray.
    if (classes['win10']) {
      classes['inactive'] = !this.windowState.getIn(['ui', 'isFocused'])
    }

    return <div id='windowContainer' className={cx(classes)} >
      <Main />
    </div>
  }

  componentDidMount () {
    appActions.windowReady(getCurrentWindowId())
  }

  componentWillUnmount () {
    windowStore.removeChangeListener(this.onChange)
    appStoreRenderer.removeChangeListener(this.onAppStateChange)
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextState.immutableData !== this.state.immutableData
  }

  onChange () {
    setImmediate(() => {
      this.windowState = windowStore.getState()
      this.setState({
        immutableData: {
          windowState: this.windowState,
          appState: this.appState
        }
      })
    })
  }

  onAppStateChange () {
    setImmediate(() => {
      this.appState = appStoreRenderer.state
      this.setState({
        immutableData: {
          windowState: this.windowState,
          appState: this.appState
        }
      })
    })
  }
}

Window.propTypes = { appState: PropTypes.object, frames: PropTypes.array, initWindowState: PropTypes.object }

module.exports = Window
