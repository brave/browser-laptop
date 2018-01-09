/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let demoValue = []

const api = {
  appendValue: (value) => {
    if (!Array.isArray(value)) {
      value = [value]
    }

    value.forEach(element => {
      demoValue.push(`${new Date().toISOString()}: ${element}`)
    })
  },

  setValue: (value) => {
    demoValue = value
  },

  getValue: () => {
    return demoValue
  },

  resetValue: () => {
    demoValue = []
  }
}

module.exports = api
