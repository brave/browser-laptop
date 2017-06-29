/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')

// Utils
const {getSetting} = require('../../../../js/settings')
const cx = require('../../../../js/lib/classSet')
const {onTabPageContextMenu} = require('../../../../js/contextMenus')
const {getCurrentWindowId} = require('../../currentWindow')
const dndData = require('../../../../js/dndData')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const dnd = require('../../../../js/dnd')

class TabPage extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  onMouseLeave () {
    windowActions.setTabPageHoverState(this.props.index, false)
  }

  onMouseEnter (e) {
    windowActions.setTabPageHoverState(this.props.index, true)
  }

  onDrop (e) {
    if (this.props.isPageEmpty) {
      return
    }

    appActions.dataDropped(getCurrentWindowId())

    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    const sourceDragFromPageIndex = this.props.sourceDragFromPageIndex
    // This must be executed async because the state change that this causes
    // will cause the onDragEnd to never run
    setTimeout(() => {
      // If we're moving to a right page, then we're already shifting everything to the left by one, so we want
      // to drop it on the right.
      windowActions.moveTab(sourceDragData.get('key'), this.props.moveToFrameKey,
        // Has -1 value for pinned tabs
        sourceDragFromPageIndex === -1 ||
        sourceDragFromPageIndex >= this.props.index)
      if (sourceDragData.get('pinnedLocation')) {
        appActions.tabPinned(sourceDragData.get('tabId'), false)
      }
    }, 0)
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frames = frameStateUtil.getNonPinnedFrames(currentWindow) || Immutable.List()
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const tabPageFrames = frames.slice(ownProps.index * tabsPerPage, (ownProps.index * tabsPerPage) + tabsPerPage)
    const isAudioPlaybackActive = tabPageFrames.find((frame) =>
    frame.get('audioPlaybackActive') && !frame.get('audioMuted'))

    let sourceDragFromPageIndex
    const sourceDragData = dnd.getInterBraveDragData()
    if (sourceDragData) {
      sourceDragFromPageIndex = frames.findIndex((frame) => frame.get('key') === sourceDragData.get('key'))

      if (sourceDragFromPageIndex !== -1) {
        sourceDragFromPageIndex /= tabsPerPage
      }
    }

    const props = {}
    // used in renderer
    props.index = ownProps.index
    props.tabPageFrames = tabPageFrames // TODO (nejc) only primitives
    props.isAudioPlaybackActive = isAudioPlaybackActive
    props.previewTabPage = getSetting(settings.SHOW_TAB_PREVIEWS)
    props.active = currentWindow.getIn(['ui', 'tabs', 'tabPageIndex']) === props.index

    // used in other functions
    props.sourceDragFromPageIndex = sourceDragFromPageIndex
    props.isPageEmpty = tabPageFrames.size === 0
    props.moveToFrameKey = tabPageFrames.getIn([0, 'key'])

    return props
  }

  render () {
    return <span
      data-tab-page={this.props.index}
      onDragOver={this.onDragOver.bind(this)}
      onMouseEnter={this.props.previewTabPage ? this.onMouseEnter : null}
      onMouseLeave={this.props.previewTabPage ? this.onMouseLeave : null}
      onDrop={this.onDrop.bind(this)}
      className={cx({
        tabPage: true,
        audioPlaybackActive: this.props.isAudioPlaybackActive,
        active: this.props.active})}
      onContextMenu={onTabPageContextMenu.bind(this, this.props.tabPageFrames)}
      onClick={windowActions.setTabPageIndex.bind(this, this.props.index)
      } />
  }
}

module.exports = ReduxComponent.connect(TabPage)
