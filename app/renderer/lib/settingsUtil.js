/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports.changeSetting = (cb, key, e) => {
  if (e.target.type === 'checkbox') {
    cb(key, e.target.value)
  } else {
    let value = e.target.value
    if (e.target.dataset && e.target.dataset.type === 'number') {
      value = parseInt(value, 10)
    } else if (e.target.dataset && e.target.dataset.type === 'float') {
      value = parseFloat(value)
    }
    if (e.target.type === 'number') {
      value = value.replace(/\D/g, '')
      value = parseInt(value, 10)
      if (Number.isNaN(value)) {
        return
      }
      value = Math.min(e.target.getAttribute('max'), Math.max(value, e.target.getAttribute('min')))
    }
    cb(key, value)
  }
}
