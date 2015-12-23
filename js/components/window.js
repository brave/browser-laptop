/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Controller view which manages the top level immutable state for the app

const React = require('react')
const Immutable = require('immutable')
const WindowStore = require('../stores/windowStore')
const Main = require('./main')
const ipc = global.require('electron').ipcRenderer
const messages = require('../constants/messages')

class Window extends React.Component {
  constructor (props) {
    super(props)

    // initialize appState from props
    // and then listen for updates
    this.appState = this.props.appState
    this.state = {
      immutableData: {
        windowState: WindowStore.getState(),
        appState: this.appState
      }
    }
    ipc.on(messages.APP_STATE_CHANGE, this.onAppStateChange.bind(this))
    WindowStore.addChangeListener(this.onChange.bind(this))
  }

  render () {
    return <div id='windowContainer'>
      <Main browser={this.state.immutableData.windowState} app={this.state.immutableData.appState} />
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
Window.propTypes = { appState: React.PropTypes.object }

module.exports = Window
