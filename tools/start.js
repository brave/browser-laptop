const path = require('path')
const spawn = require('child_process').spawn

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const options = {
  env: process.env,
  stdio: 'inherit',
  shell: true
}
const electron = spawn('electron', [path.join(__dirname, '..')].concat(process.argv.slice(2)), options)

electron.on('error', (err) => {
  console.error(`could not start electron ${err}`)
})

electron.on('exit', (code, signal) => {
  console.log(`process exited with code ${code}`)
  process.exit(code)
})

process.on('SIGTERM', () => {
  electron.kill('SIGTERM')
})

process.on('SIGINT', () => {
  electron.kill('SIGINT')
})
