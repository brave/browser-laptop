/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Tab = require('./tab')

class PinnedTabs extends ImmutableComponent {
  render () {
    return <div className='pinnedTabs'>
       {
          this.props.frames
            .filter(frameProps => frameProps.get('isPinned'))
            .map(frameProps =>
                <Tab activeDraggedTab={this.props.tabs.get('activeDraggedTab')}
                  frameProps={frameProps}
                  frames={this.props.frames}
                  key={'tab-' + frameProps.get('key')}
                  paintTabs={this.props.paintTabs}
                  previewTabs={this.props.previewTabs}
                  isActive={this.props.activeFrame === frameProps}
                  isPrivate={frameProps.get('isPrivate')}
                  partOfFullPageSet={this.props.partOfFullPageSet}/>)
      }
    </div>
  }
}

module.exports = PinnedTabs
