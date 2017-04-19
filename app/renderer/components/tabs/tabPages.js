/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')
const TabPage = require('./tabPage')

// Utils
const dnd = require('../../../../js/dnd')

class TabPages extends ImmutableComponent {
  render () {
    const tabPageCount = Math.ceil(this.props.frames.size / this.props.tabsPerTabPage)
    let sourceDragFromPageIndex
    const sourceDragData = dnd.getInterBraveDragData()
    if (sourceDragData) {
      sourceDragFromPageIndex = this.props.frames.findIndex((frame) => frame.get('key') === sourceDragData.get('key'))
      if (sourceDragFromPageIndex !== -1) {
        sourceDragFromPageIndex /= this.props.tabsPerTabPage
      }
    }
    return <div className='tabPageWrap'>
      {
        tabPageCount > 1 &&
        Array.from(new Array(tabPageCount)).map((x, i) =>
          <TabPage
            key={`tabPage-${i}`}
            tabPageFrames={this.props.frames.slice(i * this.props.tabsPerTabPage, (i * this.props.tabsPerTabPage) + this.props.tabsPerTabPage)}
            previewTabPage={this.props.previewTabPage}
            index={i}
            sourceDragFromPageIndex={sourceDragFromPageIndex}
            active={this.props.tabPageIndex === i} />)
      }
    </div>
  }
}

module.exports = TabPages
