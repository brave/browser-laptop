var fs = require('fs')
var exec = require('child_process').exec

// get our version
var pack = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
var version = pack.version

console.log('Building installer for version ' + version + ' in win64-dist')

// a cert file must be present to sign the created package
// a password MUST be passed as the CERT_PASSWORD environment variable
var cert = process.env.CERT || 'brave-authenticode.pfx'
var cert_password = process.env.CERT_PASSWORD
if (!cert_password) throw new Error('Certificate password required. Set environment variable CERT_PASSWORD.')

var cmds = [
  'electron-installer-squirrel-windows "Brave-win32-x64" --platform=win --out="dist" --name=brave --product_name="Brave" --config=builderConfig.json --overwrite --debug --loading_gif="res/brave_splash_installing.gif" --setup_icon=res/app.ico --cert_path=' + cert + ' --cert_password=' + cert_password
]

var cmd = cmds.join(' && ')

console.log(cmd)

exec(cmd, function (err, stdout, stderr) {
  if (err) console.error(err)
  console.log(stdout)
  console.log(stderr)
})
