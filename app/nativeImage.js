/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const nativeImage = electron.nativeImage
const clipboard = electron.clipboard

module.exports.copyDataURL = (dataURL, html, text) => {
  clipboard.write({
    image: nativeImage.createFromDataURL(dataURL),
    html: html,
    text: text
  })
}
