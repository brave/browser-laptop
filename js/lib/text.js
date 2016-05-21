/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Add ... characters and limit length of a string to a specific size
module.exports.ellipse = (text, length) => {
  var tokens = text.split(/\s+/)
  if (tokens.length > length) {
    return tokens.slice(0, length).join(' ') + '...'
  } else {
    return tokens.join(' ')
  }
}
