var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec

var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var version = pack.version

console.log(version)
process.chdir(path.join(__dirname, 'Brave-darwin-x64'))

exec('zip -qr Brave-' + version + '.zip Brave.app/')
