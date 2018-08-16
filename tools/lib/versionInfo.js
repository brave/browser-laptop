const fs = require('fs')
const pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const electronPrebuiltPack = JSON.parse(fs.readFileSync('./node_modules/electron-prebuilt/package.json', 'utf-8'))
module.exports.braveVersion = pack.version
module.exports.electronVersion = (process.env.npm_config_brave_electron_version || electronPrebuiltPack.version).replace(/-.*/, '')
module.exports.muonVersion = (process.env.npm_config_brave_electron_version || electronPrebuiltPack.version).replace(/-.*/, '')
