/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 *   
 * New Tab
 * */

const React = require('react')
const ImmutableComponent = require('../../../app/renderer/components/immutableComponent')

class Stats extends ImmutableComponent {
  get millisecondsPerItem () {
    return 50
  }
  get trackedBlockersCount () {
    return this.props.newTabData.get('trackedBlockersCount') || 0
  }
  get adblockCount () {
    return this.props.newTabData.get('adblockCount') || 0
  }
  get httpsUpgradedCount () {
    return this.props.newTabData.get('httpsUpgradedCount') || 0
  }
  get estimatedTimeSaved () {
    const estimatedMillisecondsSaved = (this.adblockCount + this.trackedBlockersCount) * this.millisecondsPerItem || 0
    const hours = estimatedMillisecondsSaved < 1000 * 60 * 60 * 24
    const minutes = estimatedMillisecondsSaved < 1000 * 60 * 60
    const seconds = estimatedMillisecondsSaved < 1000 * 60
    let counter
    let text

    if (seconds) {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000)
      text = 'seconds'
    } else if (minutes) {
      counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60)
      text = 'minutes'
    } else if (hours) {
      // Refer to http://stackoverflow.com/a/12830454/2950032 for the detailed reasoning behind the + after
      // toFixed is applied. In a nutshell, + is used to discard unnecessary trailing 0s after calling toFixed
      counter = +((estimatedMillisecondsSaved / 1000 / 60 / 60).toFixed(1))
      text = 'hours'
    } else {
      // Otherwise the output is in days
      counter = +((estimatedMillisecondsSaved / 1000 / 60 / 60 / 24).toFixed(2))
      text = 'days'
    }

    return {
      id: text,
      value: counter,
      args: JSON.stringify({ value: counter })
    }
  }
  render () {
    const trackedBlockersCount = this.trackedBlockersCount
    const adblockCount = this.adblockCount
    const httpsUpgradedCount = this.httpsUpgradedCount
    const timeSaved = this.estimatedTimeSaved
    const blockedArgs = JSON.stringify({
      adblockCount: adblockCount,
      trackedBlockersCount: trackedBlockersCount,
      httpsUpgradedCount: httpsUpgradedCount
    })
    return <ul className='statsContainer'>
      <li className='statsBlock'>
        <span className='counter trackers' data-test-id='trackers'>{trackedBlockersCount.toLocaleString()}</span>
        <span className='statsText' data-l10n-id='trackersBlocked' data-l10n-args={blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter ads' data-test-id='ads'>{adblockCount.toLocaleString()}</span>
        <span className='statsText' data-l10n-id='adsBlocked' data-l10n-args={blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter https'>{httpsUpgradedCount.toLocaleString()}</span>
        <span className='statsText' data-l10n-id='httpsUpgraded' data-l10n-args={blockedArgs} />
      </li>
      <li className='statsBlock'>
        <span className='counter timeSaved' data-test-id='timeSaved'>
          {timeSaved.value} <span className='text' data-l10n-id={timeSaved.id} data-l10n-args={timeSaved.args} />
        </span>
        <span className='statsText' data-l10n-id='estimatedTimeSaved' />
      </li>
    </ul>
  }
}
module.exports = Stats
