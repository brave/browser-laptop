/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// HACK mousemove will only trigger in the other window if the coords are inside the bounds but
// will trigger for this window even if the mouse is outside the window, since we started a dragEvent,
// *but* it will forward anything for globalX and globalY, so we'll send the client coords in those properties
// and send some fake coords in the clientX and clientY properties
// An alternative solution would be for the other window to just call electron API
// to get mouse cursor, and we could just send 0, 0 coords, but this reduces the spread of electron
// calls in components, and also puts the (tiny) computation in another process, freeing the other
// window to perform the animation,
// Or perhaps use a manual ipc channel
function createEventForSendMouseMoveInput (screenX, screenY, modifiers = [ ]) {
  return {
    type: 'mousemove',
    x: 1, // identifier that we have created event manually, see HACK notes above
    y: 99, // ^
    globalX: screenX,
    globalY: screenY,
    modifiers
  }
}

// HACK - see the related `createEventFromSendMouseMoveInput`
function translateEventFromSendMouseMoveInput (receivedEvent) {
  return (receivedEvent.x === 1 && receivedEvent.y === 99)
    ? { clientX: receivedEvent.screenX || 0, clientY: receivedEvent.screenY || 0 }
    : receivedEvent
}

module.exports = {
  createEventForSendMouseMoveInput,
  translateEventFromSendMouseMoveInput
}
