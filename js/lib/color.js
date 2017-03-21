/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.parseColor = (color) => {
  const div = document.createElement('div')
  div.style.color = color
  return div.style.color.split('(')[1].split(')')[0].split(',')
}

module.exports.getTextColorForBackground = (color) => {
  // Calculate text color based on contrast with background:
  // https://24ways.org/2010/calculating-color-contrast/
  const rgb = module.exports.parseColor(color)
  if (!rgb) {
    return null
  }
  const [r, g, b] = rgb
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return yiq >= 128 ? 'black' : 'white'
}
