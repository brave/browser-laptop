/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.parseColor = (color) => {
  const div = document.createElement('div')
  div.style.color = color
  const normalizedColor = div.style.color
  if (typeof normalizedColor === 'string' &&
      normalizedColor.includes('(') &&
      normalizedColor.includes(')') &&
      normalizedColor.includes(',')) {
    return div.style.color.split('(')[1].split(')')[0].split(',')
  }
  return null
}

module.exports.backgroundRequiresLightText = (color) => {
  // Calculate text color based on contrast with background:
  // https://24ways.org/2010/calculating-color-contrast/
  const rgb = module.exports.parseColor(color)
  if (!rgb) {
    return null
  }
  const [r, g, b] = rgb
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return yiq < 128
}

module.exports.getTextColorForBackground = (color) => {
  return module.exports.backgroundRequiresLightText(color) ? 'white' : 'black'
}

module.exports.removeAlphaChannelForBackground = (color, bR, bG, bB) => {
  const rgba = module.exports.parseColor(color)
  if (!rgba) {
    return null
  }
  // handle no alpha channel
  if (rgba.length !== 4 || Number.isNaN(rgba[3])) {
    return color
  }

  // remove alpha channel, blending color with background
  const [oR, oG, oB, oA] = rgba

  const newR = blendChannel(oR, bR, oA)
  const newG = blendChannel(oG, bG, oA)
  const newB = blendChannel(oB, bB, oA)
  return `rgb(${newR}, ${newG}, ${newB})`
}

function blendChannel (original, background, alpha) {
  return Math.round((original * alpha) + ((1 - alpha) * background))
}
