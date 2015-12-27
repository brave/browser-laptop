/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const Button = require('./button')
const WindowActions = require('../actions/windowActions')
import Config from '../constants/config.js'

class TabsToolbarButtons extends ImmutableComponent {
  onMenu () {
  }

  render () {
    return <div className='tabsToolbarButtons'>
      { this.props.partOfFullPageSet
          ? <Button iconClass='fa-plus'
              className='navbutton new-frame-button' onClick={WindowActions.newFrame} /> : null }
      <Button iconClass='fa-bars'
        className='navbutton menu-button'
        onClick={this.onMenu.bind(this)} />
    </div>
  }
}

class TabsToolbar extends ImmutableComponent {
  render () {
    const tabPageIndex = this.props.tabs.get('tabPageIndex')
    const startingFrameIndex = tabPageIndex * Config.tabs.tabsPerPage
    const currentFrames = this.props.frames.slice(startingFrameIndex, startingFrameIndex + Config.tabs.tabsPerPage)

    return <div className='tabsToolbar'>
      <Tabs tabs={this.props.tabs}
        frames={this.props.frames}
        activeFrame={this.props.activeFrame}
        tabPageIndex={tabPageIndex}
        currentFrames={currentFrames}
        startingFrameIndex={startingFrameIndex}
        partOfFullPageSet={currentFrames.size === Config.tabs.tabsPerPage}
      />
      <TabsToolbarButtons partOfFullPageSet={currentFrames.size === Config.tabs.tabsPerPage}/>
    </div>
  }
}

module.exports = TabsToolbar
