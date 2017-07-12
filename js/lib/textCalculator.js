/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.calculateTextWidth = (text, font = '11px Arial') => {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = font
  return ctx.measureText(text).width
}
