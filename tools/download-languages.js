/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const path = require('path')
const fs = require('fs')
const request = require('request')

// The names of the directories in the locales folder are used as a list of languages to retrieve
var languages = fs.readdirSync(path.join(__dirname, '..', 'app', 'locales')).filter(function (language) {
  return language !== 'en-US'
}).map(function (language) {
  return language.replace('-', '_')
})

// Setup the credentials
const username = process.env.USERNAME
const password = process.env.PASSWORD
if (!(username && password)) {
  throw new Error('The USERNAME and PASSWORD environment variables must be set to the Transifex credentials')
}

// URI and resource list
const TEMPLATE = 'http://www.transifex.com/api/2/project/brave-laptop/resource/RESOURCE_SLUG/translation/LANG_CODE/?file'
const resources = [
  'app', 'menu', 'downloads', 'preferences', 'passwords', 'bookmarks'
]

// For each language / resource combination
languages.forEach(function (languageCode) {
  resources.forEach(function (resource) {
    // Build the URI
    var URI = TEMPLATE.replace('RESOURCE_SLUG', resource + 'properties')
    URI = URI.replace('LANG_CODE', languageCode)

    // Authorize and request the translation file
    request.get(URI, {
      'auth': {
        'user': username,
        'pass': password,
        'sendImmediately': true
      }
    }, function (error, response, body) {
      if (error) {
        // Report errors (often timeouts)
        console.log(error.toString())
      } else {
        // Build the filename and store the translation file
        var filename = path.join(__dirname, '..', 'app', 'locales', languageCode.replace('_', '-'), resource + '.properties')
        fs.writeFileSync(filename, body)
        console.log('[*] ' + filename)
      }
    })
  })
})
