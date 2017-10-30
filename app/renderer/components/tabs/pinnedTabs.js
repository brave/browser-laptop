/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const ConnectedDragSortDetachTab = require('./connectedDragSortDetachTab')
const ListWithTransitions = require('./ListWithTransitions')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const globalStyles = require('../styles/global')

// Utils
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getCurrentWindowId} = require('../../currentWindow')

class PinnedTabs extends React.Component {
  constructor (...args) {
    super(...args)
    this.onTabStartDragSortDetach = this.onTabStartDragSortDetach.bind(this)
    this.onDragChangeIndex = this.onDragChangeIndex.bind(this)
  }

  onTabStartDragSortDetach (frame, clientX, clientY, screenX, screenY, dragElementWidth, dragElementHeight, relativeXDragStart, relativeYDragStart) {
    appActions.tabDragStarted(
      getCurrentWindowId(),
      frame,
      frame.get('tabId'),
      clientX,
      clientY,
      screenX,
      screenY,
      dragElementWidth,
      dragElementHeight,
      relativeXDragStart,
      relativeYDragStart,
      false
   )
  }

  onDragChangeIndex (currentIndex, destinationIndex) {
    // We do not need to know which tab is changing index, since
    // the currently-dragged tabId is stored on state.
    // Move display index immediately
    windowActions.tabDragChangeGroupDisplayIndex(true, destinationIndex)
    return true
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const pinnedFrames = frameStateUtil.getPinnedFrames(currentWindow)
      .filter(frame => frame.get('tabStripWindowId') === getCurrentWindowId())
    const previewFrameKey = frameStateUtil.getPreviewFrameKey(currentWindow)

    const props = {}
    // used in renderer
    props.pinnedTabs = pinnedFrames
    props.isPreviewingPinnedTab = previewFrameKey && props.pinnedTabs.some(key => key === previewFrameKey)
    return props
  }

  render () {
    return <ListWithTransitions
      className={css(
        styles.pinnedTabs,
        this.props.isPreviewingPinnedTab && styles.pinnedTabs_previewing
      )}
      data-test-id='pinnedTabs'
      typeName='div'
      duration={710}
      delay={0}
      staggerDelayBy={0}
      easing='cubic-bezier(0.23, 1, 0.32, 1)'
      enterAnimation={[
        {
          transform: 'translateY(50%)'
        },
        {
          transform: 'translateY(0)'
        }
      ]}
      leaveAnimation={[
        {
          transform: 'translateY(0)'
        },
        {
          transform: 'translateY(100%)'
        }
      ]}
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}
    >
      {
        this.props.pinnedTabs
          .map((frame, tabDisplayIndex) =>
            <ConnectedDragSortDetachTab
              frame={frame}
              key={`tab-${frame.get('tabId')}-${frame.get('key')}`}
              // required for DragSortDetachTab
              dragData={frame}
              dragCanDetach={false}
              firstItemDisplayIndex={0}
              displayIndex={tabDisplayIndex}
              displayedTabCount={this.props.pinnedTabs.size}
              totalTabCount={this.props.pinnedTabs.size}
              onStartDragSortDetach={this.onTabStartDragSortDetach}
              onDragChangeIndex={this.onDragChangeIndex}
            />
          )
      }
    </ListWithTransitions>
  }
}

const styles = StyleSheet.create({
  pinnedTabs: {
    height: '-webkit-fill-available',
    display: 'flex',
    alignItems: 'stretch',
    boxSizing: 'border-box',
    position: 'relative',
    marginLeft: 0,
    marginTop: 0
  },

  pinnedTabs_previewing: {
    zIndex: globalStyles.zindex.zindexTabs + 1
  }
})

module.exports = ReduxComponent.connect(PinnedTabs)
