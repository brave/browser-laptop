/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Tabs = require('./tabs')
const PinnedTabs = require('./pinnedTabs')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

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
    const pinnedTabs = frameStateUtil.getPinnedFrames(currentWindow)

    const props = {}
    // used in renderer
    props.hasPinnedTabs = pinnedTabs.size > 0

    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.activeFrameLocation = activeFrame.get('location', '')
    props.activeFrameTitle = activeFrame.get('title', '')

    return props
  }

  render () {
    return <div
      className='tabsToolbar'
      onContextMenu={this.onContextMenu}>
      {
        this.props.hasPinnedTabs
        ? <PinnedTabs />
        : null
      }
      <Tabs />
      <div className='tabsToolbarButtons'>
        <span data-l10n-id='menuButton'
          className='navbutton menuButton'
          onClick={this.onHamburgerMenu}
        />
      </div>
    </div>
  }
}

module.exports = ReduxComponent.connect(TabsToolbar)
