/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')

class NewTabPage extends ImmutableComponent {
  render () {
    // TODO: Implement some kind of tiles based new tab page
    return <div />
  }
}

module.exports = <NewTabPage />

// TODO: development for the newtab page is under way
// see https://github.com/brave/browser-laptop/pull/3199 for more info

// class UnfinishedNewTabPage extends ImmutableComponent {
//   get millisecondsPerItem () {
//     return 50
//   }
//   get trackedBlockersCount () {
//     return 0
//   }
//   get adblockCount () {
//     return 0
//   }
//   get httpsUpgradedCount () {
//     return 0
//   }
//   get estimatedTimeSaved () {
//     const estimatedMillisecondsSaved = (this.adblockCount + this.trackedBlockersCount) * this.millisecondsPerItem || 0
//     const hours = estimatedMillisecondsSaved < 1000 * 60 * 60 * 24
//     const minutes = estimatedMillisecondsSaved < 1000 * 60 * 60
//     const seconds = estimatedMillisecondsSaved < 1000 * 60
//     let counter
//     let text

//     if (seconds) {
//       counter = Math.ceil(estimatedMillisecondsSaved / 1000)
//       text = 'seconds'
//     } else if (minutes) {
//       counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60)
//       text = 'minutes'
//     } else if (hours) {
//       counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60)
//       text = 'hours'
//     } else {
//       // Otherwise the output is in days
//       counter = Math.ceil(estimatedMillisecondsSaved / 1000 / 60 / 60 / 24)
//       text = 'days'
//     }

//     return {
//       id: text,
//       value: counter,
//       args: JSON.stringify({ value: counter })
//     }
//   }
//   render () {
//     const timeSaved = this.estimatedTimeSaved
//     const blockedArgs = JSON.stringify({
//       adblockCount: this.adblockCount,
//       trackedBlockersCount: this.trackedBlockersCount,
//       httpsUpgradedCount: this.httpsUpgradedCount
//     })
//     return <div>
//       <ul className='statsContainer'>
//         <li className='statsBlock'>
//           <span className='counter trackers'>{this.trackedBlockersCount}</span>
//           <span className='statsText' data-l10n-id='trackersBlocked' data-l10n-args={blockedArgs} />
//         </li>
//         <li className='statsBlock'>
//           <span className='counter ads'>{this.adblockCount}</span>
//           <span className='statsText' data-l10n-id='adsBlocked' data-l10n-args={blockedArgs} />
//         </li>
//         <li className='statsBlock'>
//           <span className='counter https'>{this.httpsUpgradedCount}</span>
//           <span className='statsText' data-l10n-id='httpsUpgraded' data-l10n-args={blockedArgs} />
//         </li>
//         <li className='statsBlock'>
//           <span className='counter timeSaved'>
//             {timeSaved.value} <span className='text' data-l10n-id={timeSaved.id} data-l10n-args={timeSaved.args} />
//           </span>
//           <span className='statsText' data-l10n-id='estimatedTimeSaved' />
//         </li>
//       </ul>
//     </div>
//   }
// }
