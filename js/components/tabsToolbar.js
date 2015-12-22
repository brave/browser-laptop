/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const Button = require('./button')
const WindowActions = require('../actions/windowActions')

class TabsToolbarButtons extends ImmutableComponent {
  onNewFrame () {
    WindowActions.newFrame()
  }

  onMenu () {
  }

  render () {
    return <div className='tabsToolbarButtons'>
      <Button iconClass='fa-plus'
        className='navbutton new-frame-button'
        onClick={this.onNewFrame.bind(this)} />
      <Button iconClass='fa-bars'
        className='navbutton menu-button'
        onClick={this.onMenu.bind(this)} />
    </div>
  }
}

class TabsToolbar extends ImmutableComponent {
  render () {
    return <div className='tabsToolbar'>
      <Tabs tabs={this.props.tabs}
        frames={this.props.frames}
        activeFrame={this.props.activeFrame}
      />
      <TabsToolbarButtons/>
    </div>
  }
}

module.exports = TabsToolbar
