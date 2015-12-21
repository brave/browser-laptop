var fs = require('fs')
var exec = require('child_process').exec

var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var version = pack.version

console.log('Building version ' + version + ' in Brave-darwin-x64')

var cmd = 'rm -rf Brave-darwin-x64 && NODE_ENV=production ./node_modules/webpack/bin/webpack.js && rm -f dist/Brave.dmg && ./node_modules/electron-packager/cli.js . Brave --overwrite --ignore="electron-download|electron-rebuild|electron-packager|electron-builder|electron-prebuilt|electron-rebuild|babel-|babel" --platform=darwin --arch=x64 --version=0.35.1 --icon=res/app.icns --app-version=' + version

console.log(cmd)

exec(cmd, function (err, stdout, stderr) {
  if (err) console.error(err)
  console.log(stdout)
})
