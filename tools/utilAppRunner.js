const path = require('path')
const proc = require('child_process')

function runUtilApp (cmd, file) {
  console.log('runUtilApp: ')

  process.env.NODE_ENV = process.env.NODE_ENV || 'development'
  const utilAppDir = path.join(__dirname, 'lib', 'utilApp')
  const options = {
    env: process.env,
    cwd: utilAppDir
  }
  cmd = cmd.split(' ')
  const utilApp = proc.spawnSync('electron', [utilAppDir].concat(cmd), options)
  if (utilApp.error) {
    console.log('Could not run utilApp - run `npm install electron-prebuilt` and try again', utilApp.error)
  }
}

module.exports = runUtilApp
