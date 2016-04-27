/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Environment Variables

  USERNAME        - valid Transifex user name with read privileges
  PASSWORD        - password for above username

  LANG [optional] - single language code to retrieve in xx-XX format (I.e. en-US)
*/

'use strict'

const path = require('path')
const fs = require('fs')
const request = require('request')

// The names of the directories in the locales folder are used as a list of languages to retrieve
var languages = fs.readdirSync(path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales')).filter(function (language) {
  return language !== 'en-US'
}).map(function (language) {
  return language.replace('-', '_')
})

// Support retrieving a single language
if (process.env.LANG) {
  languages = [process.env.LANG]
}

// Setup the credentials
const username = process.env.USERNAME
const password = process.env.PASSWORD
if (!(username && password)) {
  throw new Error('The USERNAME and PASSWORD environment variables must be set to the Transifex credentials')
}

// URI and resource list
const TEMPLATE = 'http://www.transifex.com/api/2/project/brave-laptop/resource/RESOURCE_SLUG/translation/LANG_CODE/?file'

// Retrieve resource names dynamically
var resources = fs.readdirSync(path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales', 'en-US')).map(function (language) {
  return language.split(/\./)[0]
})

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
        if (response.statusCode === 401) {
          throw new Error('Unauthorized - Are the USERNAME and PASSWORD env vars set correctly?')
        }
        // Build the filename and store the translation file
        var filename = path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales', languageCode.replace('_', '-'), resource + '.properties')
        console.log('[*] ' + filename)
        if (process.env.TEST) {
          console.log(body)
        } else {
          fs.writeFileSync(filename, body)
        }
      }
    })
  })
})
