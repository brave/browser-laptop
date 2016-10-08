/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

class Stats extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    return <ul className='statsContainer'>
      <li className='statsBlock'>
        <span className='counter trackers'>{this.props.trackedBlockersCount}</span>
        <span className='statsText' data-l10n-id='trackersBlocked' data-l10n-args={this.props.blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter ads'>{this.props.adblockCount}</span>
        <span className='statsText' data-l10n-id='adsBlocked' data-l10n-args={this.props.blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter https'>{this.props.httpsUpgradedCount}</span>
        <span className='statsText' data-l10n-id='httpsUpgraded' data-l10n-args={this.props.blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter timeSaved'>
          {this.props.timeSaved.value} <span className='text' data-l10n-id={this.props.timeSaved.id} data-l10n-args={this.props.timeSaved.args} />
        </span>
        <span className='statsText' data-l10n-id='estimatedTimeSaved' />
      </li>
    </ul>
  }
}
module.exports = Stats
