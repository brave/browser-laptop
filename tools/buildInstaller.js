var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const arch = 'x64'
const buildDir = 'Brave-' + process.platform + '-' + arch
const outDir = 'dist'
var cmds

console.log('Building install and update for version ' + VersionInfo.braveVersion + ' in ' + buildDir + ' with Electron ' + VersionInfo.electronVersion)

if (isDarwin) {
  const identifier = process.env.IDENTIFIER
  if (!identifier) {
    console.error('IDENTIFIER needs to be set to the certificate organization')
    process.exit(1)
  }

  cmds = [
    // Remove old
    'rm -f ' + outDir + '/Brave.dmg',

    // Sign it
    'cd ' + buildDir + '/Brave.app/Contents/Frameworks',
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER *',
    'cd ../../..',
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER Brave.app/',

    // Package it into a dmg
    'cd ..',
    'electron-builder \"' + buildDir + '/Brave.app\"' +
      ' --platform=osx ' +
      ' --out=\"' + outDir + '\" ' +
      ' --config=builderConfig.json ' +
      ' --overwrite',

     // Create an update zip
    'ditto -c -k --sequesterRsrc --keepParent ' + buildDir + '/Brave.app dist/Brave-' + VersionInfo.braveVersion + '.zip'
  ]
} else if (isWindows) {
  // a cert file must be present to sign the created package
  // a password MUST be passed as the CERT_PASSWORD environment variable
  var cert = process.env.CERT || 'brave-authenticode.pfx'
  var certPassword = process.env.CERT_PASSWORD
  if (!certPassword) {
    throw new Error('Certificate password required. Set environment variable CERT_PASSWORD.')
  }
  cmds = [
    'electron-installer-squirrel-windows "' + buildDir + '" --platform=win --out="' + outDir + '" --name=brave --product_name="Brave" --config=builderConfig.json --overwrite --debug --loading_gif="res/brave_splash_installing.gif" --setup_icon=res/app.ico --cert_path=' + cert + ' --cert_password=' + certPassword
  ]
} else if (isLinux) {
  console.log('Install with sudo dpkg -i dist/brave_' + VersionInfo.braveVersion + '_amd64.deb')
  console.log('Or install with sudo rpm -i dist/brave_' + VersionInfo.braveVersion + '.amd64.rpm')
  cmds = [
    // .deb file
    'electron-installer-debian' +
      ' --src Brave-linux-x64/' +
      ' --dest dist/' +
      ' --arch amd64' +
      ' --config res/linuxPackaging.json',
    // .rpm file
    'electron-installer-redhat' +
      ' --src Brave-linux-x64/' +
      ' --dest dist/' +
      ' --arch amd64' +
      ' --config res/linuxPackaging.json',
    // .tar.bz2 file
    'tar -jcvf dist/Brave.tar.bz2 ./Brave-linux-x64'
  ]
} else {
  console.log('Installer not supported for platform: ' + process.platform)
  process.exit(1)
}

execute(cmds, {}, console.log.bind(null, 'done'))
