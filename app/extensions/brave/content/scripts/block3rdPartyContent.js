/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function blockReferer () {
  window.Document.prototype.__defineGetter__('referrer', () => { return document.location.origin })
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
if (chrome.contentSettings.cookies != 'allow') {
  executeScript(getBlockCookieScript())
}

// Block Chromecast (unsupported)
// Necessary otherwise players will try to send the cast_sender.js script
// https://github.com/brave/browser-laptop/issues/14475
executeScript('window.chrome.cast = undefined')
