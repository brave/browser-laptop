var fs = require('fs')
var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var electronPrebuiltPack = JSON.parse(fs.readFileSync('./node_modules/electron-prebuilt/package.json', 'utf-8'))
module.exports.braveVersion = pack.version
module.exports.electronVersion = electronPrebuiltPack.version
