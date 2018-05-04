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

    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.activeFrameLocation = activeFrame.get('location', '')
    props.activeFrameTitle = activeFrame.get('title', '')

    return props
  }

  render () {
    return <div className={css(styles.tabsToolbar)}
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
    boxSizing: 'border-box',
    backgroundColor: theme.tabsToolbar.backgroundColor,
    display: 'flex',
    userSelect: 'none',
    WebkitAppRegion: 'no-drag',

    // Default border styles
    borderWidth: '1px 0 0 0',
    borderStyle: 'solid',
    borderColor: theme.tabsToolbar.border.color,

    // This element is set as border-box so it does not
    // take into account the borders as width gutter, so we
    // increase its size by 1px to include the top border.
    // This MUST result in an even number so we support veritcal centering.
    height: globalStyles.spacing.tabsToolbarHeight
  }
})

module.exports = ReduxComponent.connect(TabsToolbar)
