/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const WindowActions = require('../actions/windowActions')
const {onTabPageContextMenu} = require('../contextMenus')

import Config from '../constants/config.js'

class TabPage extends ImmutableComponent {
  render () {
    const audioPlaybackActive = this.props.frames.find(frame =>
        frame.get('audioPlaybackActive') && !frame.get('audioMuted'))
    return <span data-tab-page={this.props.index}
      className={cx({
        tabPage: true,
        audioPlaybackActive,
        active: this.props.active})}
        onContextMenu={onTabPageContextMenu.bind(this, this.props.frames)}
        onClick={WindowActions.setTabPageIndex.bind(this, this.props.index)
      }>
    </span>
  }
}

class TabPages extends ImmutableComponent {
  get tabCount () {
    return Math.ceil(this.props.frames.size / Config.tabs.tabsPerPage)
  }

  render () {
    return <div className='tabPages'>
    {
      Array.from(new Array(this.tabCount)).map((x, i) =>
        <TabPage
          key={`tabPage-${i}`}
          frames={this.props.frames.slice(i * Config.tabs.tabsPerPage, i * Config.tabs.tabsPerPage + Config.tabs.tabsPerPage)}
          index={i}
          active={this.props.tabPageIndex === i}/>)
    }
    </div>
  }
}

module.exports = TabPages
