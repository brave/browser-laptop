const os = require('os')
const path = require('path')
const execute = require('./lib/execute')

console.log('Patching electron-builder native modules, please wait...')

const braveGyp = path.join(os.homedir(), '.brave-gyp')
const env = {
  HOME: braveGyp,
  APPDATA: braveGyp
}

const rebuildCmd = '"../.bin/node-gyp" rebuild'

const isDarwin = process.platform === 'darwin'

const cmds = []
if (process.env.TARGET_ARCH === 'ia32') {
  cmds.push(
    'cp .npmrc ./node_modules/leveldown',
    'cd ./node_modules/leveldown',
    // leveldown prebuild isn't respecting the npm_config_arch env
    // for some reason, so always compile it.
    'npm run rebuild'
  )
}

if (isDarwin) {
  cmds.push(
    'cd ..',
    'cp .npmrc ./node_modules/macos-alias',
    'cp .npmrc ./node_modules/fs-xattr',
    'cd ./node_modules/macos-alias',
    rebuildCmd,
    'cd ../fs-xattr',
    rebuildCmd
  )
}

execute(cmds, env, console.log.bind(null, 'done'))
