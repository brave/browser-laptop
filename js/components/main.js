/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const electron = global.require('electron')
const ipc = electron.ipcRenderer

// Actions
const AppActions = require('../actions/appActions')

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')
const Tabs = require('./tabs')

// Constants
const Config = require('../constants/config')

// State handling
const FrameStateUtil = require('../state/frameStateUtil')

class Main extends ImmutableComponent {
  componentDidMount () {
    if (this.props.browser.get('frames').isEmpty()) {
      AppActions.newFrame({
        location: Config.defaultUrl
      })
    }

    ipc.on('shortcut-new-frame', (event, url) => {
      AppActions.newFrame({
        location: url || Config.defaultUrl
      })

      // Focus URL bar when adding tab via shortcut
      electron.remote.getCurrentWebContents().send('shortcut-focus-url')
    })

    ipc.on('shortcut-close-frame', () => AppActions.closeFrame())
    ipc.on('shortcut-undo-closed-frame', () => AppActions.undoClosedFrame())

    const self = this
    ipc.on('shortcut-set-active-frame-by-index', (e, i) =>
      AppActions.setActiveFrame(FrameStateUtil.getFrameByIndex(self.props.browser, i)))

    ipc.on('shortcut-set-active-frame-to-last', () =>
      AppActions.setActiveFrame(self.props.browser.getIn(['frames', self.props.browser.get('frames').size - 1])))
  }

  get activeFrame () {
    return this.refs[`frame${this.props.browser.get('activeFrameKey')}`]
  }

  onBack () {
    this.activeFrame.goBack()
  }

  onForward () {
    this.activeFrame.goForward()
  }

  onMainFocus () {
    // When the main container is in focus, set the URL bar to inactive.
    AppActions.setUrlBarActive(false)
  }

  render () {
    const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
      ? 1 : b.get('key') > a.get('key') ? -1 : 0

    // Sort frames by key so that the order of the frames do not change which could
    // cause unexpected reloading when a user moves tabs.
    // All frame operations work off of frame keys and not index though so unsorted frames
    // can be passed everywhere other than the Frame elements.
    const sortedFrames = this.props.browser.get('frames').sort(comparatorByKeyAsc)

    let activeFrame = FrameStateUtil.getActiveFrame(this.props.browser)
    return <div id='browser'>
      <div className='top'>
        <div className='backforward'>
          <span
            className='back fa fa-angle-left'
            disabled={!activeFrame || !activeFrame.get('canGoBack')}
            onClick={this.onBack.bind(this)} />
          <span
            className='forward fa fa-angle-right'
            disabled={!activeFrame || !activeFrame.get('canGoForward')}
            onClick={this.onForward.bind(this)} />
        </div>
        <NavigationBar
          navbar={this.props.browser.getIn(['ui', 'navbar'])}
          frames={this.props.browser.get('frames')}
          sites={this.props.browser.get('sites')}
          activeFrame={activeFrame}
        />
        <Tabs
          tabs={this.props.browser.getIn(['ui', 'tabs'])}
          frames={this.props.browser.get('frames')}
          key='tab-bar'
          activeFrame={activeFrame}
        />
      </div>
      <div className='mainContainer'
        onFocus={this.onMainFocus.bind(this)}>
        <div className='tabContainer'>
        {
          sortedFrames.map(frame =>
            <Frame
              ref={`frame${frame.get('key')}`}
              frame={frame}
              key={frame.get('key')}
              isActive={FrameStateUtil.isFrameKeyActive(this.props.browser, frame.get('key'))}
            />)
        }
        </div>
      </div>
    </div>
  }
}

module.exports = Main
