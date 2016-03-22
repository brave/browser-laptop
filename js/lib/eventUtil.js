/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const isDarwin = process.platform === 'darwin'
module.exports.isForSecondaryAction = (e) =>
  e.ctrlKey && !isDarwin ||
  e.metaKey && isDarwin ||
  e.button === 1
