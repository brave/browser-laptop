/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.getBase64FromImageUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onerror = function () {
      reject(new Error('unable to load image'))
    }
    img.onload = function () {
      const canvas = document.createElement('canvas')
      canvas.width = this.naturalWidth
      canvas.height = this.naturalHeight
      canvas.getContext('2d')
        .drawImage(this, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = url
  })
}

module.exports.getWorkingImageUrl = (url, cb) => {
  const img = new window.Image()
  img.onload = () => cb(true)
  img.onerror = () => cb(false)
  img.src = url
}
