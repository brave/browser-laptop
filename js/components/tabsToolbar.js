/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const PinnedTabs = require('./pinnedTabs')
const contextMenus = require('../contextMenus')
const windowStore = require('../stores/windowStore')

class TabsToolbarButtons extends ImmutableComponent {
  render () {
    return <div className='tabsToolbarButtons'>
      <span data-l10n-id='menuButton'
        className='navbutton menuButton'
        onClick={this.props.onMenu} />
    </div>
  }
}

class TabsToolbar extends ImmutableComponent {
  constructor () {
    super()
    this.onContextMenu = this.onContextMenu.bind(this)
  }

  onContextMenu (e) {
    if (this.refs.tabs.wasNewTabClicked(e.target)) {
      // Don't show the tabs menu if the new tab "+"" was clicked
      return
    }
    contextMenus.onTabsToolbarContextMenu(windowStore.getFrame(this.props.activeFrameKey), undefined, undefined, e)
  }

  render () {
    const index = this.props.previewTabPageIndex !== undefined
      ? this.props.previewTabPageIndex : this.props.tabPageIndex
    const startingFrameIndex = index * this.props.tabsPerTabPage
    const pinnedTabs = this.props.tabs.filter((tab) => tab.get('pinnedLocation'))
    const unpinnedTabs = this.props.tabs.filter((tab) => !tab.get('pinnedLocation'))
    const currentTabs = unpinnedTabs
      .slice(startingFrameIndex, startingFrameIndex + this.props.tabsPerTabPage)
    return <div className='tabsToolbar'
      onContextMenu={this.onContextMenu}>
      {
        pinnedTabs.size > 0
        ? <PinnedTabs sites={this.props.sites}
          activeFrameKey={this.props.activeFrameKey}
          paintTabs={this.props.paintTabs}
          previewTabs={this.props.previewTabs}
          dragData={this.props.dragData}
          tabPageIndex={this.props.tabPageIndex}
          pinnedTabs={pinnedTabs}
          />
        : null
      }
      <Tabs
        ref='tabs'
        tabs={unpinnedTabs}
        shouldAllowWindowDrag={this.props.shouldAllowWindowDrag}
        dragData={this.props.dragData}
        paintTabs={this.props.paintTabs}
        previewTabs={this.props.previewTabs}
        tabsPerTabPage={this.props.tabsPerTabPage}
        activeFrameKey={this.props.activeFrameKey}
        tabPageIndex={this.props.tabPageIndex}
        hasTabInFullScreen={this.props.hasTabInFullScreen}
        tabBreakpoint={this.props.tabBreakpoint}
        currentTabs={currentTabs}
        previewTabPageIndex={this.props.previewTabPageIndex}
        startingFrameIndex={startingFrameIndex}
        partOfFullPageSet={currentTabs.size === this.props.tabsPerTabPage}
        fixTabWidth={this.props.fixTabWidth}
      />
      <TabsToolbarButtons
        noFrames={currentTabs.size === 0}
        onMenu={this.props.onMenu} />
    </div>
  }
}

module.exports = TabsToolbar
