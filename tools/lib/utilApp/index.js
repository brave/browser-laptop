'use strict'

const electron = require('electron')
const app = electron.app
app.setName('brave')
require('../../../app/browser/lib/patchUserDataDir')

const path = require('path')
const rimraf = require('../rimraf')

const cleanUserData = (location) => {
  location = location ? path.join(app.getPath('userData'), location) : app.getPath('userData')
  if (location && location !== '') {
    console.log(`removing ${location}...`)
    rimraf.sync(location)
  }
}

app.on('ready', () => {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'cleanUserData':
      cleanUserData(process.argv[3])
      break
  }
  process.exit(0)
})
