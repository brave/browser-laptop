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
const BrowserButton = require('../common/browserButton')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const tabDraggingState = require('../../../common/state/tabDraggingState')
const { getCurrentWindowId } = require('../../currentWindow')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

const menuButton = require('../../../../img/toolbar/menu_btn.svg')

class TabsToolbar extends React.Component {
  constructor (props) {
    super(props)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onHamburgerMenu = this.onHamburgerMenu.bind(this)
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

  onHamburgerMenu (e) {
    contextMenus.onHamburgerMenu(this.props.activeFrameLocation, e)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const pinnedTabs = frameStateUtil.getPinnedFrames(currentWindow) || Immutable.List()
    const props = {}
    // used in renderer
    const isNonSourceSingleTabDraggingWindow = tabDraggingState.app.isCurrentWindowDetached(state) && tabDraggingState.app.getSourceWindowId(state) !== getCurrentWindowId()
    props.hasPinnedTabs = !isNonSourceSingleTabDraggingWindow && !pinnedTabs.isEmpty()
    props.hasPreview = frameStateUtil.getPreviewFrameKey(currentWindow) != null
    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.activeFrameLocation = activeFrame.get('location', '')
    props.activeFrameTitle = activeFrame.get('title', '')

    return props
  }

  render () {
    return <div className={css(
        styles.tabsToolbar,
        !this.props.hasPreview && styles.tabsToolbar_withoutTabPreview
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
      <BrowserButton
        iconOnly
        isMaskImage
        size={`calc(${globalStyles.spacing.tabsToolbarHeight} - 1px)`}
        custom={styles.tabsToolbar__button_menu}
        l10nId='menuButton'
        testId='menuButton'
        onClick={this.onHamburgerMenu}
      />
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
  },

  tabsToolbar_withoutTabPreview: {
    overflowY: 'hidden'
  },

  tabsToolbar__button_menu: {
    backgroundColor: theme.tabsToolbar.button.backgroundColor,
    WebkitMaskImage: `url(${menuButton})`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: '12px 12px',
    WebkitMaskOrigin: 'border',
    marginRight: '5px',

    ':hover': {
      opacity: 1.0,
      backgroundColor: theme.tabsToolbar.button.onHover.backgroundColor
    }
  }
})

module.exports = ReduxComponent.connect(TabsToolbar)
