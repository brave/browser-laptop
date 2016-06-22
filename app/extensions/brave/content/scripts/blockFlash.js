/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */


function blockFlashDetection () {
  const handler = {
    length: 0,
    item: () => { return null },
    namedItem: () => { return null },
    refresh: () => {}
  }
  Navigator.prototype.__defineGetter__('plugins', () => { return handler })
  Navigator.prototype.__defineGetter__('mimeTypes', () => { return handler })
}

function getBlockFlashPageScript () {
  return '(' + Function.prototype.toString.call(blockFlashDetection) + '());'
}

if (!window.location.search ||
    !window.location.search.includes('brave_flash_allowed')) {
  executeScript(getBlockFlashPageScript())
}
