/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Executes a script in the page DOM context
 *
 * @param {string} text The content of the script to insert
 * @param {Object=} data attributes to set in the inserted script tag
 */
function executeScript (code) {
  chrome.webFrame.executeJavaScript(code)
}

/**
 * Whether an element is editable or can be typed into.
 * @param {Element} elem
 * @return {boolean}
 */
function isEditable (elem) {
  // TODO: find other node types that are editable
  return ((elem.contentEditable && elem.contentEditable !== 'false' && elem.contentEditable !== 'inherit') ||
          elem.nodeName.toLowerCase() === 'input' ||
          elem.nodeName.toLowerCase() === 'textarea')
}

/**
 * Whether we are on macOS
 * @return {boolean}
 */
function isPlatformOSX () {
  // TODO: navigator.platform is getting deprecated
  return window.navigator.platform.includes('Mac')
}

function hasWhitespace (text) {
  return /\s/g.test(text);
}

function isTorTab () {
  return chrome.contentSettings.torEnabled != 'allow'
}
