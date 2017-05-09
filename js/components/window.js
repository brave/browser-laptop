/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Controller view which manages the top level immutable state for the app

const React = require('react')
const PropTypes = require('prop-types')
const Immutable = require('immutable')
const windowStore = require('../stores/windowStore')
const appStoreRenderer = require('../stores/appStoreRenderer')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const Main = require('./main')
const cx = require('../lib/classSet')
const {getPlatformStyles} = require('../../app/common/lib/platformUtil')
const {getCurrentWindowId} = require('../../app/renderer/currentWindow')

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
        })
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
      <Main windowState={this.state.immutableData.windowState}
        appState={this.state.immutableData.appState} />
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
    this.windowState = windowStore.getState()
    this.setState({
      immutableData: {
        windowState: this.windowState,
        appState: this.appState
      }
    })
  }

  onAppStateChange () {
    this.appState = appStoreRenderer.state
    this.setState({
      immutableData: {
        windowState: this.windowState,
        appState: this.appState
      }
    })
  }
}

Window.propTypes = { appState: PropTypes.object, frames: PropTypes.array, initWindowState: PropTypes.object }

module.exports = Window
