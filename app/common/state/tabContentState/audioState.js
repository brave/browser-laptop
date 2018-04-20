/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// State helpers
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Utils
const {isEntryIntersected} = require('../../../../app/renderer/lib/observerUtil')

module.exports.canPlayAudio = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return frame.get('audioPlaybackActive') || frame.get('audioMuted')
}

module.exports.isAudioMuted = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  const tabCanPlayAudio = module.exports.canPlayAudio(state, frameKey)
  return tabCanPlayAudio && frame.get('audioMuted')
}

module.exports.showAudioIcon = (state, frameKey) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  return (
    !isEntryIntersected(state, 'tabs') &&
    module.exports.canPlayAudio(state, frameKey)
  )
}

module.exports.showAudioTopBorder = (state, frameKey, isPinned) => {
  const frame = frameStateUtil.getFrameByKey(state, frameKey)

  if (frame == null) {
    return false
  }

  if (module.exports.isAudioMuted(state, frameKey)) {
    return false
  }

  return (
    module.exports.canPlayAudio(state, frameKey) &&
    (isEntryIntersected(state, 'tabs') || isPinned)
  )
}
