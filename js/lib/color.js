module.exports.parseColor = (color) => {
  const div = document.createElement('div')
  div.style.color = color
  const m = div.style.color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
  if (m) {
    return [m[1], m[2], m[3]]
  } else {
    return null
  }
}

module.exports.getTextColorForBackground = (color) => {
  // Calculate text color based on contrast with background:
  // https://24ways.org/2010/calculating-color-contrast/
  const rgb = module.exports.parseColor(color)
  if (!rgb) {
    return null
  }
  let [r, g, b] = rgb
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}
