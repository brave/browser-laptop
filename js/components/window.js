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
const SiteTags = require('../constants/siteTags')

class Window extends React.Component {
  constructor (props) {
    super(props)

    // initialize appState from props
    // and then listen for updates
    this.appState = Immutable.fromJS(this.props.appState)
    this.windowState = WindowStore.getState()
    this.state = {
      immutableData: {
        windowState: this.windowState,
        appState: this.appState
      }
    }
    ipc.on(messages.APP_STATE_CHANGE, (e, action) => {
      this.appState = Immutable.fromJS(action)
      this.setState({
        immutableData: {
          windowState: this.windowState,
          appState: this.appState
        }
      })
      this.onAppStateChanged()
    })
    this.onAppStateChanged()
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
    this.windowState = WindowStore.getState()
    this.setState({
      immutableData: {
        windowState: this.windowState,
        appState: this.appState
      }
    })
  }

  onAppStateChanged () {
    const sites = this.appState.get('sites')
    const frames = this.windowState.get('frames')

    // Check for new pinned sites which we don't already know about
    const sitesToAdd = sites
      .filter(site => site.get('tags').includes(SiteTags.PINNED) &&
          !frames.find(frame => frame.get('isPinned') &&
            frame.get('location') === site.get('location')))
    sitesToAdd.forEach(site => {
      WindowActions.newFrame({
        location: site.get('location'),
        isPinned: true
      }, false)
    })

    // Check for unpinned sites which should be closed
    const framesToClose = frames.filter(frame =>
      frame.get('isPinned') && !sites.find(site => frame.get('location') === site.get('location') && site.get('tags').includes(SiteTags.PINNED)))
    framesToClose.forEach(frameProps => WindowActions.closeFrame(frames, frameProps, true))
  }
}
Window.propTypes = { appState: React.PropTypes.object, frames: React.PropTypes.array }

module.exports = Window
