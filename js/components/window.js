/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Controller view which manages the top level immutable state for the app

const React = require('react')
const Immutable = require('immutable')
const windowStore = require('../stores/windowStore')
const appStoreRenderer = require('../stores/appStoreRenderer')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const Main = require('./main')
const cx = require('../lib/classSet')
const {getPlatformStyles} = require('../../app/common/lib/platformUtil')
const alreadyPinnedTabs = new Set()
const {currentWindowId, isFocused} = require('../../app/renderer/currentWindow')
const {isPinnedTab} = require('../state/siteUtil')

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

    this.syncPinnedTabs()

    // Find all the pinned sites which have no tabs yet and create a tab for these
    this.appState.get('sites')
      .filter((site) => isPinnedTab(site.get('tags')) && !alreadyPinnedTabs.has(site.get('location')))
      .forEach((site) => {
        const url = site.get('location')
        alreadyPinnedTabs.add(url)
        appActions.createTabRequested({
          url,
          partition: site.get('partition'),
          pinned: true
        })
      })

    this.onChange = this.onChange.bind(this)
    this.onAppStateChange = this.onAppStateChange.bind(this)
    windowStore.addChangeListener(this.onChange)
    appStoreRenderer.addChangeListener(this.onAppStateChange)
  }
  syncPinnedTabs () {
    // Only sync pinned tabs when a window is focused to avoid race conditions
    if (!isFocused) {
      console.log('---- !isFocused so returning')
      return
    }
    console.log('---- isFocused so syncPinnedTabas')

    // Shortcut to only do this when the number of pinned tabs in app storage changes
    const pinnedTabSize = this.appState.get('tabs').filter((tab) => tab.get('pinned')).size
    if (pinnedTabSize === this.lastPinnedTabSize) {
      return
    }

    // Avoid duplicate pinned tabs by ensuing all frames are inside the alreadyPinnedTabs set
    const frames = windowStore.state.get('frames')
    frames
      .filter((frame) => frame.get('pinnedLocation'))
      .map((frame) => frame.get('pinnedLocation'))
      .forEach(Set.prototype.add.bind(alreadyPinnedTabs))

    const pinnedTabs = this.appState.get('tabs')
      .filter((tab) => tab.get('pinned'))

    // Calculate the unpinned tabs and then remove them from memory.
    // The actual removal will be done in frame.js when detection of pinned status changes.
    const pinnedTabUrls = pinnedTabs.map((tab) => tab.get('url'))
    const tabsToRemove = Array.from(alreadyPinnedTabs.values())
      .filter((x) => {
        const result = !pinnedTabUrls.includes(x)
        console.log('checking for has:', x, 'result:', result)
        return result
      })

    // Preload current app tabs that are pinned into already pinned locations
    pinnedTabs.filter((tab) => !alreadyPinnedTabs.has(tab.get('url')))
      .forEach((tab) => {
        const url = tab.get('url')
        alreadyPinnedTabs.add(url)
        const site = this.appState.get('sites').find(function (element) { return element.get('location') === url })
        const icon = site && site.get('favicon') || undefined
        console.log('----adding pin: ', url)
        appActions.newWebContentsAdded(currentWindowId, {
          location: url,
          partition: tab.get('partition'),
          guestInstanceId: tab.get('guestInstanceId'),
          pinnedLocation: url,
          icon
        })
      })

    if (tabsToRemove.length > 0) {
      console.log('---removing pins:')
      tabsToRemove.forEach(console.log.bind(console))
      console.log('---alreadyPinnedTabs:')
      Array.from(alreadyPinnedTabs.values()).forEach(console.log.bind(console))
      console.log('---pinnedTabUrls:')
      pinnedTabUrls.toJS().forEach(console.log.bind(console))
      console.log('---end')
    }
    tabsToRemove.forEach(Set.prototype.delete.bind(alreadyPinnedTabs))
    this.lastPinnedTabSize = pinnedTabSize
  }

  componentWillMount () {
    if (!this.props.initWindowState || this.props.initWindowState.frames.length === 0) {
      if (this.props.frames.length === 0) {
        appActions.createTabRequested({})
      } else {
        this.props.frames.forEach((frame, i) => {
          if (frame.guestInstanceId) {
            appActions.newWebContentsAdded(currentWindowId, frame)
            return
          }
          appActions.createTabRequested({
            url: frame.location,
            partitionNumber: frame.partitionNumber,
            isPrivate: frame.isPrivate,
            active: i === 0
          })
        })
      }
    }
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
      classes['inactive'] = !this.windowState.getIn(['ui', 'hasFocus'])
    }

    return <div id='windowContainer' className={cx(classes)} >
      <Main windowState={this.state.immutableData.windowState}
        appState={this.state.immutableData.appState} />
    </div>
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

    if (!this.props.includePinnedSites) {
      return
    }

    this.syncPinnedTabs()

    /*

    let pinnedTabs = this.appState.get('tabs').filter(
      (tab) => tab.get('pinned') &&
        !alreadyPinnedTabs.has(tab.get('url')))

    pinnedTabs = pinnedTabs
      .filter((pinnedTab) => {
        return !frames.find((frame) => frame.get('pinnedLocation') &&
            // Compare to the original src of the pinned frame
            frame.get('pinnedLocation') === pinnedTab.get('url') &&
            (frame.get('partitionNumber') || 0) === (pinnedTab.get('partition') || 0))
      })

    // console.log('----------------pinnedTabs size:', pinnedTabs.size)
    pinnedTabs.forEach((pinnedTab) => {
      const url = pinnedTab.get('url')
    })

    // Check for unpinned sites which should be closed
    const framesToClose = frames.filter((frame) =>
      frame.get('pinnedLocation') &&
      // Compare to the original src of the pinned frame
      !pinnedTabs.find((pinnedTab) => frame.get('pinnedLocation') === pinnedTab.get('url') &&
        (frame.get('partitionNumber') || 0) === (pinnedTab.get('partition') || 0)))
    framesToClose.forEach((frameProps) => windowActions.closeFrame(frames, frameProps, true))
    */
  }
}
Window.propTypes = { appState: React.PropTypes.object, frames: React.PropTypes.array, initWindowState: React.PropTypes.object }

module.exports = Window
