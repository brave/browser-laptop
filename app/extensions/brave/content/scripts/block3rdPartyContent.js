/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function blockReferer () {
  if (document.referrer) {
    // Blocks cross-origin referer
    var parser = document.createElement('a')
    parser.href = document.referrer
    if (parser.origin !== document.location.origin) {
      window.Document.prototype.__defineGetter__('referrer', () => { return document.location.origin })
    }
  }
}

function getBlockRefererScript () {
  return '(' + Function.prototype.toString.call(blockReferer) + '());'
}

if (chrome.contentSettings.referer != 'allow' &&
    document.location.origin && document.location.origin !== 'https://youtube.googleapis.com') {
  executeScript(getBlockRefererScript())
}
