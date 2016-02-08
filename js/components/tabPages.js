/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')
const WindowActions = require('../actions/windowActions')
const {onTabPageContextMenu} = require('../contextMenus')

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
  get tabPageCount () {
    return Math.ceil(this.props.frames.size / this.props.tabsPerTabPage)
  }

  render () {
    return <div
      className={cx({
        tabPages: true,
        singlePage: this.tabPageCount <= 1
      })}>
    {
      this.tabPageCount > 1 &&
      Array.from(new Array(this.tabPageCount)).map((x, i) =>
        <TabPage
          key={`tabPage-${i}`}
          frames={this.props.frames.slice(i * this.props.tabsPerTabPage, i * this.props.tabsPerTabPage + this.props.tabsPerTabPage)}
          index={i}
          active={this.props.tabPageIndex === i}/>)
    }
    </div>
  }
}

module.exports = TabPages
