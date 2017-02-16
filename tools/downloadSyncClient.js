'use strict'

const path = require('path')
const fs = require('fs')
const request = require('request')

const filename = path.join(__dirname, '..',
  'app', 'extensions', 'brave', 'content', 'scripts', 'sync.js')
const releaseUrl = 'https://api.github.com/repos/brave/sync/releases/latest'

request({
  url: releaseUrl,
  headers: { 'User-Agent': 'request' }
}, function (error, response, body) {
  if (error || response.statusCode !== 200) {
    console.log('could not get', releaseUrl)
    return
  }
  try {
    const assets = JSON.parse(body).assets
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].name === 'bundle.js') {
        const downloadUrl = assets[i].browser_download_url
        request({
          url: downloadUrl,
          headers: { 'User-Agent': 'request' }
        }, function (error, response, body) {
          if (error || response.statusCode !== 200) {
            console.log('could not get', downloadUrl)
            return
          }
          // Save the sync bundle
          console.log('writing sync bundle to ' + filename)
          fs.writeFileSync(filename, body)
        })
        break
      }
    }
  } catch (e) {
    console.log('got error parsing download URL', e)
  }
})
