'use strict'

const path = require('path')
const fs = require('fs-extra')

const srcFilename = path.join(__dirname, '..',
  'node_modules', '@brave', 'sync-client', 'bundle.js')
const filename = path.join(__dirname, '..',
  'app', 'extensions', 'brave', 'content', 'scripts', 'sync.js')

const srcConstantsDirectory = path.join(__dirname, '..',
  'node_modules', '@brave', 'sync-client', 'constants')
const constantsDirectory = path.join(__dirname, '..',
  'js', 'constants', 'sync')

console.log('copying sync bundle to', filename, constantsDirectory)
fs.copySync(srcFilename, filename)
fs.copySync(srcConstantsDirectory, constantsDirectory)
