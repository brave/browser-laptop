/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function hasBraveDragData (dataTransfer) {
  if (!dataTransfer || !dataTransfer.types) {
    return false
  }
  for (let i = 0; i < dataTransfer.types.length; i++) {
    let type = dataTransfer.types[i]
    if (type && type.startsWith('application/x-brave-')) {
      return true
    }
  }
  return false
}

function blockDndData (e) {
  if (hasBraveDragData(e.dataTransfer)) {
    // Block drag data from the Brave UI
    try {
      e.dataTransfer.dropEffect = 'none'
    } catch (e) {}
    e.preventDefault()
    e.stopPropagation()
    return false
  }
  return true
}

window.addEventListener('dragover', blockDndData, true)
window.addEventListener('dragenter', blockDndData, true)
window.addEventListener('dragleave', blockDndData, true)
window.addEventListener('drop', blockDndData, true)
