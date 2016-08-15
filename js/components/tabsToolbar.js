/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const Button = require('./button')
const PinnedTabs = require('./pinnedTabs')
const contextMenus = require('../contextMenus')
const windowStore = require('../stores/windowStore')

class TabsToolbarButtons extends ImmutableComponent {
  render () {
    return <div className='tabsToolbarButtons'>
      <Button iconClass='fa-bars'
        l10nId='menuButton'
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
          draggingOverData={this.props.draggingOverData}
          tabPageIndex={this.props.tabPageIndex}
          pinnedTabs={pinnedTabs}
          />
        : null
      }
      <Tabs tabs={unpinnedTabs}
        shouldAllowWindowDrag={this.props.shouldAllowWindowDrag}
        draggingOverData={this.props.draggingOverData}
        paintTabs={this.props.paintTabs}
        previewTabs={this.props.previewTabs}
        tabsPerTabPage={this.props.tabsPerTabPage}
        activeFrameKey={this.props.activeFrameKey}
        tabPageIndex={this.props.tabPageIndex}
        currentTabs={currentTabs}
        previewTabPageIndex={this.props.previewTabPageIndex}
        startingFrameIndex={startingFrameIndex}
        partOfFullPageSet={currentTabs.size === this.props.tabsPerTabPage}
      />
      <TabsToolbarButtons
        noFrames={currentTabs.size === 0}
        onMenu={this.props.onMenu} />
    </div>
  }
}

module.exports = TabsToolbar
