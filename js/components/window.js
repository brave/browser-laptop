/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Controller view which manages the top level immutable state for the app

const React = require('react')
const Immutable = require('immutable')
const WindowStore = require('../stores/windowStore')
const WindowActions = require('../actions/windowActions')
const Main = require('./main')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

class Window extends React.Component {
  constructor (props) {
    super(props)

    // initialize appState from props
    // and then listen for updates
    this.appState = Immutable.fromJS(this.props.appState)
    this.state = {
      immutableData: {
        windowState: WindowStore.getState(),
        appState: this.appState
      }
    }
    ipc.on(messages.APP_STATE_CHANGE, (e, action) => {
      this.onAppStateChange(Immutable.fromJS(action))
    })
    WindowStore.addChangeListener(this.onChange.bind(this))
  }

  componentWillMount () {
    this.props.frames.forEach((frame) => {
      WindowActions.newFrame(frame)
    })
  }

  render () {
    return <div id='windowContainer'>
      <Main windowState={this.state.immutableData.windowState}
        appState={this.state.immutableData.appState} />
    </div>
  }

  componentWillUnmount () {
    WindowStore.removeChangeListener(this.onChange.bind(this))
    ipc.removeListener(this.onAppStateChange)
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !Immutable.is(nextState.immutableData, this.state.immutableData)
  }

  onChange () {
    this.setState({
      immutableData: {
        windowState: WindowStore.getState(),
        appState: this.appState
      }
    })
  }

  onAppStateChange (appState) {
    this.appState = appState
    this.onChange()
  }
}
Window.propTypes = { appState: React.PropTypes.object, frames: React.PropTypes.array }

module.exports = Window
