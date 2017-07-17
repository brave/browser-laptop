/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const JSON_POINTER_ESCAPE_CODES = {
  '~0': '~',
  '~1': '/'
}

const JSON_POINTER_REGEX = new RegExp(Object.keys(JSON_POINTER_ESCAPE_CODES).join('|'), 'gi')

/**
 * Unescape a JSON pointer path part. (i.e. ~
 * https://stackoverflow.com/questions/31483170/purpose-of-tilde-in-json-pointer
 * @param {string} string JSON pointer part.
 * @returns {string}
 */
module.exports.unescapeJSONPointer = (string) => {
  return string.replace(JSON_POINTER_REGEX, (match) => {
    return JSON_POINTER_ESCAPE_CODES[match]
  })
}
