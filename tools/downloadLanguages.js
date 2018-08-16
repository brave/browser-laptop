/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Environment Variables

  USERNAME            - valid Transifex user name with read privileges
  PASSWORD            - password for above username

  LANG [optional]     - single language code to retrieve in xx-XX format (I.e. en-US)
  RESOURCE [optional] - single file name to retrieve (I.e. app)
*/

'use strict'

const path = require('path')
const fs = require('fs')
var request = require('request')

// The names of the directories in the locales folder are used as a list of languages to retrieve
let languages = fs.readdirSync(path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales')).filter(function (language) {
  return language !== 'en-US'
}).map(function (language) {
  return language.replace('-', '_')
})

// Support retrieving a single language
if (process.env.LANG_CODE) {
  languages = [process.env.LANG_CODE]
}

if (process.env.META) {
  const localLanguages = fs.readdirSync(path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales'))
  console.log(`    <meta name="availableLanguages" content="${localLanguages.join(', ')}">`)
  console.log(localLanguages.map(function (l) {
    return `'${l}'`
  }).join(',\n  '))
  process.exit(0)
}

// Setup the credentials
const username = process.env.USERNAME
const password = process.env.PASSWORD
if (!(username && password)) {
  throw new Error('The USERNAME and PASSWORD environment variables must be set to the Transifex credentials')
}

// URI and resource list
const TEMPLATE = 'https://www.transifex.com/api/2/project/brave-laptop/resource/RESOURCE_SLUG/translation/LANG_CODE/?file'

// Retrieve resource names dynamically
let resources = fs.readdirSync(path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales', 'en-US')).map(function (language) {
  return language.split(/\./)[0]
})

// allow download of a single resource
if (process.env.RESOURCE) {
  resources = [process.env.RESOURCE]
}

// For each language / resource combination
languages.forEach(function (languageCode) {
  resources.forEach(function (resource) {
    // Build the URI
    let URI = TEMPLATE.replace('RESOURCE_SLUG', resource.toLowerCase() + 'properties')
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
        // Check to see if the directory exists, if not create it
        const directory = path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales', languageCode.replace('_', '-'))
        if (!fs.existsSync(directory)) {
          console.log(`${languageCode} does not exist - creating directory`)
          if (!process.env.TEST) {
            fs.mkdirSync(directory)
          } else {
            console.log(`${languageCode} would have been created`)
          }
        } else {
          // Directory exists - continue
        }

        // Build the filename and store the translation file
        const filename = path.join(__dirname, '..', 'app', 'extensions', 'brave', 'locales', languageCode.replace('_', '-'), resource + '.properties')
        console.log('[*] ' + filename)
        if (process.env.TEST) {
          console.log(body)
        } else {
          if (body === 'Not Found') {
            console.log('  *** WARNING - empty file contents for ' + resource + '. Not writing. ***')
          } else {
            fs.writeFileSync(filename, body)
          }
        }
      }
    })
  })
})
