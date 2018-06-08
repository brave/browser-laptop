/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const windowStore = require('../../js/stores/windowStore')
const appActions = require('../../js/actions/appActions')
const debounce = require('../../js/lib/debounce')

function mapFramesByKey (immutableFrameList) {
  const frames = { }
  for (const frame of immutableFrameList.values()) {
    const frameKey = frame.get('key')
    if (frameKey == null) {
      console.error('immutableFrameList had frame with invalid key', { frame, immutableFrameList })
      continue
    }
    frames[frameKey] = frame.delete('lastAccessedTime')
  }
  return frames
}

module.exports = function trackFrameChanges () {
  // relay frame changes back to browser
  let frames = { }
  let idleCallbackId = null

  // compare frames to previous state and only send those changed in an action
  const relayFrameChanges = () => {
    idleCallbackId = null
    const state = windowStore.state
    const shouldDebugStoreActions = state.get('debugStoreActions')
    let t0
    if (shouldDebugStoreActions) {
      t0 = window.performance.now()
    }
    const currentFrameState = state.get('frames')
    if (!currentFrameState) {
      return
    }
    const lastFrames = frames
    frames = mapFramesByKey(currentFrameState)
    const changedFrames = []
    for (const frameKey in frames) {
      // does it exist in the last version of state?
      const frame = frames[frameKey]
      const lastFrame = lastFrames[frameKey]
      if (!lastFrame || !lastFrame.equals(frame)) {
        changedFrames.push(Immutable.Map({ frame }))
      }
    }
    if (changedFrames.length) {
      appActions.framesChanged(changedFrames)
    }
    if (shouldDebugStoreActions) {
      console.log(`%cSpent ${window.performance.now() - t0}ms figuring out frame changes (${changedFrames.length} changed)`, 'color: #bbb')
    }
  }

  // compare frames when state changes debounced, and only when thread is idle
  const onWindowStoreChanged = debounce(() => {
    if (!idleCallbackId) {
      idleCallbackId = window.requestIdleCallback(relayFrameChanges, { timeout: 1000 })
    }
  }, 250)

  windowStore.addChangeListener(onWindowStoreChanged)
}
