const path = require('path')
const spawn = require('child_process').spawn
const startReduxDevtoolsServer = require('./reduxRemoteDevtoolsServer')

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const storeDevtoolFlagName = '--store-devtool'
if (process.env.NODE_ENV === 'development' && process.argv.includes(storeDevtoolFlagName)) {
  startReduxDevtoolsServer(storeDevtoolFlagName)
}

const options = {
  env: process.env,
  stdio: 'inherit',
  shell: true
}
const muon = spawn('electron', [`"${path.join(__dirname, '..')}"`].concat(process.argv.slice(2)), options)

muon.on('error', (err) => {
  console.error(`could not start muon ${err}`)
})

muon.on('exit', (code, signal) => {
  console.log(`process exited with code ${code}`)
  process.exit(code)
})

process.on('SIGTERM', () => {
  muon.kill('SIGTERM')
})

process.on('SIGINT', () => {
  muon.kill('SIGINT')
})
