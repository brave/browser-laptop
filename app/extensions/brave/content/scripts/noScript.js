/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if (chrome.contentSettings.javascript == 'block') {
  document.querySelectorAll('script').forEach((s) => {
    // TODO: Send all of these in one IPC call
    chrome.ipc.sendToHost('scripts-blocked',
      s.src ? s.src : window.location.href)
  })
}
