/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tabs = require('./tabs')
const TabPages = require('./tabPages')

class TabsToolbar extends ImmutableComponent {
  render () {
    return <div className='tabsToolbar'>
      <TabPages frames={this.props.frames}
        tabPageIndex={this.props.tabs.get('tabPageIndex')}
      />
      <Tabs tabs={this.props.tabs}
        frames={this.props.frames}
        activeFrame={this.props.activeFrame}
      />
    </div>
  }
}

module.exports = TabsToolbar
