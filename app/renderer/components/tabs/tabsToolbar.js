/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Tabs = require('./tabs')
const PinnedTabs = require('./pinnedTabs')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

class TabsToolbar extends React.Component {
  constructor (props) {
    super(props)
    this.onContextMenu = this.onContextMenu.bind(this)
  }

  onContextMenu (e) {
    if (e.target.tagName === 'BUTTON') {
      return
    }

    contextMenus.onTabsToolbarContextMenu(
      this.props.activeFrameTitle,
      this.props.activeFrameLocation,
      undefined,
      undefined,
      e
    )
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const pinnedTabs = frameStateUtil.getPinnedFrames(currentWindow) || Immutable.List()

    const props = {}
    // used in renderer
    props.hasPinnedTabs = !pinnedTabs.isEmpty()
    props.hasPreview = (frameStateUtil.getPreviewFrameKey(currentWindow) != null)

    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.activeFrameLocation = activeFrame.get('location', '')
    props.activeFrameTitle = activeFrame.get('title', '')

    return props
  }

  render () {
    return <div
      className={css(
        styles.tabsToolbar,
        this.props.hasPreview && styles.tabsToolbar_hasPreview
      )}
      data-test-id='tabsToolbar'
      onContextMenu={this.onContextMenu}
    >
      {
        this.props.hasPinnedTabs
        ? <PinnedTabs />
        : null
      }
      <Tabs />
    </div>
  }
}

const styles = StyleSheet.create({
  tabsToolbar: {
    paddingTop: '1px',
    boxSizing: 'content-box',
    backgroundColor: theme.tabsToolbar.backgroundColor,
    display: 'flex',
    userSelect: 'none',
    WebkitAppRegion: 'no-drag',

    // This element is set as border-box so it does not
    // take into account the borders as width gutter, so we
    // increase its size by 1px to include the top border.
    // This MUST result in an even number so we support veritcal centering.
    height: globalStyles.spacing.tabsToolbarHeight,
    position: 'relative',
    // shadow done as pseudo element so that z-index can be controlled
    ':after': {
      boxShadow: 'inset 0 -0.5px var(--tabs-toolbar-shadow-spread, 3px) -0.5px rgba(0, 0, 0, 0.22)',
      '--tabs-toolbar-transit-duration': theme.tab.transitionDurationOut,
      '--tabs-toolbar-transit-easing': theme.tab.transitionEasingOut,
      transition: `box-shadow var(--tabs-toolbar-transit-duration) var(--tabs-toolbar-transit-easing)`,
      pointerEvents: 'none',
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      left: 0,
      zIndex: 200,
      display: 'block',
      content: '" "',
      willChange: 'box-shadow'
    }
  },

  tabsToolbar_hasPreview: {
    ':after': {
      boxShadow: 'inset 0 -3px var(--tabs-toolbar-shadow-spread, 6px) -0.5px rgba(0, 0, 0, 0.22)',
      '--tabs-toolbar-transit-duration': theme.tab.transitionDurationIn,
      '--tabs-toolbar-transit-easing': theme.tab.transitionEasingIn
    }
  }
})

module.exports = ReduxComponent.connect(TabsToolbar)
