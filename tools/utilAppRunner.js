const path = require('path')
const proc = require('child_process')

function runUtilApp (cmd, file, stdioOptions) {
  console.log('runUtilApp: ')

  process.env.NODE_ENV = process.env.NODE_ENV || 'development'
  const utilAppDir = path.join(__dirname, 'lib', 'utilApp')
  const options = {
    env: process.env,
    cwd: utilAppDir,
    stdio: stdioOptions,
    shell: true
  }
  cmd = cmd.split(' ')
  if (process.env.NODE_ENV === 'development') {
    cmd.push('--user-data-dir=brave-development')
  }
  const utilApp = proc.spawnSync('electron', [utilAppDir].concat(cmd), options)
  if (utilApp.error) {
    console.log('Could not run utilApp - run `npm install electron-prebuilt` and try again', utilApp.error)
  }
  return utilApp
}

module.exports = runUtilApp
