/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

import Config from '../constants/config.js'

class TabPage extends ImmutableComponent {
  render () {
    return <span className='tabPage'>
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
      Array.from(new Array(this.tabCount)).map(() => <TabPage/>)
    }
    </div>
  }
}

module.exports = TabPages
