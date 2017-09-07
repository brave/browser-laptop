/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const tabUIState = require('../tabUIState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Constants
const {tabs} = require('../../../../js/constants/config')

module.exports.isPartitionTab = (state, frameKey) => {
  return module.exports.getPartitionNumber(state, frameKey) > 0
}

module.exports.getPartitionNumber = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return 0
  }

  const partitionNumber = frame.get('partitionNumber')
  if (typeof partitionNumber === 'string') {
    return Number(partitionNumber.replace(/^partition-/i, ''))
  }
  return Number(partitionNumber)
}

module.exports.getMaxAllowedPartitionNumber = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return 0
  }

  const partitionNumber = module.exports.getPartitionNumber(state, frameKey)

  if (partitionNumber > tabs.maxAllowedNewSessions) {
    return tabs.maxAllowedNewSessions
  }
  return partitionNumber
}

module.exports.showPartitionIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    module.exports.isPartitionTab(state, frameKey) &&
    tabUIState.showTabEndIcon(state, frameKey)
  )
}
