/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Whether this is running in a third-party document.
 */
function is3rdPartyDoc () {
  try {
    // Try accessing an element that cross-origin frames aren't supposed to
    window.top.document
  } catch (e) {
    if (e.name === 'SecurityError') {
      return true
    } else {
      console.log('got unexpected error accessing window.top.document', e)
      // Err on the safe side and assume this is a third-party frame
      return true
    }
  }
  return false
}

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

function blockCookie () {
  // Block js cookie storage
  window.Document.prototype.__defineGetter__('cookie', () => { return '' })
  window.Document.prototype.__defineSetter__('cookie', () => {})
}

function getBlockRefererScript () {
  return '(' + Function.prototype.toString.call(blockReferer) + '());'
}

function getBlockCookieScript () {
  return '(' + Function.prototype.toString.call(blockCookie) + '());'
}

if (chrome.contentSettings.referer != 'allow' &&
    document.location.origin && document.location.origin !== 'https://youtube.googleapis.com') {
  executeScript(getBlockRefererScript())
}
if (chrome.contentSettings.cookies != 'allow' && is3rdPartyDoc()) {
  executeScript(getBlockCookieScript())
}
