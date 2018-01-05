/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { EventEmitter } = require('events')
const electron = require('electron')

const INTERVAL_POLL_MOUSEPOSITION_MS = 10
let isObservingCursorPosition = false

const screenUtil = new EventEmitter()

screenUtil.on('newListener', (event) => {
  if (event === 'mousemove') {
    startObservingMousePosition()
  }
})

screenUtil.on('removeListener', (event) => {
  if (event === 'mousemove' && isObservingCursorPosition) {
    const listenerCount = screenUtil.listenerCount('mousemove')
    if (!listenerCount) {
      stopObservingMousePosition()
    }
  }
})

function startObservingMousePosition () {
  if (!isObservingCursorPosition) {
    isObservingCursorPosition = true
    continuouslyReportMousePosition()
  }
}

let timeoutObserveMousePosition
function stopObservingMousePosition () {
  isObservingCursorPosition = false
  if (timeoutObserveMousePosition) {
    clearTimeout(timeoutObserveMousePosition)
  }
}

let cachePosX, cachePosY
function continuouslyReportMousePosition () {
  timeoutObserveMousePosition = null
  if (!isObservingCursorPosition) {
    return
  }
  const mouseScreenPos = electron.screen.getCursorScreenPoint()
  if (mouseScreenPos.x !== cachePosX || mouseScreenPos.y !== cachePosY) {
    cachePosX = mouseScreenPos.x
    cachePosY = mouseScreenPos.y
    screenUtil.emit('mousemove', {
      screenX: cachePosX,
      screenY: cachePosY
    })
  }
  // stop continuation of event if we've stopped listening
  timeoutObserveMousePosition = setTimeout(continuouslyReportMousePosition, INTERVAL_POLL_MOUSEPOSITION_MS)
}

module.exports = screenUtil
