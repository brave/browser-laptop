/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const path = require('path')
const fs = require('fs')

const promoCodeFileRelativeUserDataPath = 'promoCode'

function getPromoCodeFileAbsolutePath () {
  return path.join(electron.app.getPath('userData'), promoCodeFileRelativeUserDataPath)
}

module.exports = {
  writeFirstRunPromoCodeSync: promoCode => {
    const promoCodeOutputPath = getPromoCodeFileAbsolutePath()
    // write promo code so state can access it
    fs.writeFileSync(promoCodeOutputPath, promoCode)
  },

  readFirstRunPromoCode: () => new Promise((resolve, reject) => {
    fs.readFile(getPromoCodeFileAbsolutePath(), (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(null)
        }
        return reject(err)
      }
      resolve(data.toString())
    })
  }),

  removePromoCode: () => new Promise((resolve, reject) => {
    fs.unlink(getPromoCodeFileAbsolutePath(), (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(null)
        }
        return reject(err)
      }
      resolve(true)
    })
  })
}
