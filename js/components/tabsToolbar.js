/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const Button = require('./button')
const PinnedTabs = require('./pinnedTabs')
const contextMenus = require('../contextMenus')

class TabsToolbarButtons extends ImmutableComponent {
  render () {
    return <div className='tabsToolbarButtons'>
      <Button iconClass='fa-bars'
        l10nId='menuButton'
        className='navbutton menu-button'
        onClick={this.props.onMenu} />
    </div>
  }
}

class TabsToolbar extends ImmutableComponent {
  render () {
    const tabPageIndex = this.props.tabs.get('tabPageIndex')
    const startingFrameIndex = tabPageIndex * this.props.tabsPerTabPage
    const pinnedFrames = this.props.frames
      .filter(frame => frame.get('pinnedLocation'))
    const currentFrames = this.props.frames
      .filter(frame => !frame.get('pinnedLocation'))
      .slice(startingFrameIndex, startingFrameIndex + this.props.tabsPerTabPage)

    return <div className='tabsToolbar'
      onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, this.props.activeFrame, undefined)}>
      { pinnedFrames.size > 0
        ? <PinnedTabs sites={this.props.sites}
        frames={this.props.frames}
        activeFrame={this.props.activeFrame}
        paintTabs={this.props.paintTabs}
        previewTabs={this.props.previewTabs}
        draggingOverData={this.props.draggingOverData}
        tabs={this.props.tabs}/> : null }
      <Tabs tabs={this.props.tabs}
        shouldAllowWindowDrag={this.props.shouldAllowWindowDrag}
        draggingOverData={this.props.draggingOverData}
        paintTabs={this.props.paintTabs}
        previewTabs={this.props.previewTabs}
        tabsPerTabPage={this.props.tabsPerTabPage}
        frames={this.props.frames}
        activeFrame={this.props.activeFrame}
        tabPageIndex={tabPageIndex}
        currentFrames={currentFrames}
        startingFrameIndex={startingFrameIndex}
        partOfFullPageSet={currentFrames.size === this.props.tabsPerTabPage}
      />
      <TabsToolbarButtons
        noFrames={currentFrames.size === 0}
        onMenu={this.props.onMenu}/>
    </div>
  }
}

module.exports = TabsToolbar
