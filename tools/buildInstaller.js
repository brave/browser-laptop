var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
var format = require('util').format
var path = require('path')

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
var outDir = 'dist'
var arch = 'x64'
var widevineCdmArch = 'win_x64'
var cmds

if (isWindows) {
  if (process.env.TARGET_ARCH === 'ia32') {
    arch = 'ia32'
    widevineCdmArch = 'win_x86'
  }
}
const buildDir = 'Brave-' + process.platform + '-' + arch

console.log('Building install and update for version ' + VersionInfo.braveVersion + ' in ' + buildDir + ' with Electron ' + VersionInfo.electronVersion)

const raiseError = (errorMessage) => {
  console.error(errorMessage)
  process.exit(1)
}

if (isDarwin || isWindows) {
  const requiredText = 'is required for widevine signing'
  if (!process.env.SIGN_WIDEVINE_PASSPHRASE) {
    raiseError('SIGN_WIDEVINE_PASSPHRASE ' + requiredText)
  }
  if (!process.env.SIGN_WIDEVINE_CERT) {
    raiseError('SIGN_WIDEVINE_CERT ' + requiredText)
  }
  if (!process.env.SIGN_WIDEVINE_KEY) {
    raiseError('SIGN_WIDEVINE_KEY ' + requiredText)
  }

  // check if widevine script exists
  const fs = require('fs')
  if (!fs.existsSync('tools/signature_generator.py')) {
    raiseError('`tools/signature_generator.py` ' + requiredText)
  }
}

if (isDarwin) {
  const identifier = process.env.IDENTIFIER
  if (!identifier) {
    raiseError('IDENTIFIER needs to be set to the certificate organization')
  }

  const wvBundle = buildDir + '/Brave.app/Contents/Frameworks/Brave Framework.framework/Brave Framework'
  const wvPlugin = buildDir + '/Brave.app/Contents/Frameworks/Brave Framework.framework/Libraries/WidevineCdm/_platform_specific/mac_x64/widevinecdmadapter.plugin'
  cmds = [
    // Remove old
    'rm -f ' + outDir + '/Brave.dmg',

    // Sign it
    'cd ' + buildDir + '/Brave.app/Contents/Frameworks',
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER *',
    'cd ../../..',
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER Brave.app/',

    // sign for widevine
    'cd ..',
    'python tools/signature_generator.py --input_file "' + wvBundle + '" --flag 1',
    'python tools/signature_generator.py --input_file "' + wvPlugin + '"',

    // Package it into a dmg
    'build ' +
      '--prepackaged="' + buildDir + '/Brave.app" ' +
      '--mac=dmg ' +
      ' --config=res/builderConfig.json ',

    // Create an update zip
    'ditto -c -k --sequesterRsrc --keepParent ' + buildDir + '/Brave.app dist/Brave-' + VersionInfo.braveVersion + '.zip'
  ]
  execute(cmds, {}, console.log.bind(null, 'done'))
} else if (isWindows) {
  // a cert file must be present to sign the created package
  // a password MUST be passed as the CERT_PASSWORD environment variable
  var cert = process.env.CERT || '../brave-authenticode.pfx'
  var certPassword = process.env.CERT_PASSWORD
  if (!certPassword) {
    raiseError('Certificate password required. Set environment variable CERT_PASSWORD.')
  }

  // sign for widevine
  const wvExe = buildDir + '/Brave.exe'
  const wvPlugin = buildDir + '/WidevineCdm/_platform_specific/' + widevineCdmArch + '/widevinecdmadapter.dll'
  cmds = [
    'python tools/signature_generator.py --input_file "' + wvExe + '" --flag 1',
    'python tools/signature_generator.py --input_file "' + wvPlugin + '"'
  ]
  execute(cmds, {}, (err) => {
    if (err) {
      raiseError('signing for widevine failed' + JSON.stringify(err))
      return
    }

    // Because both x64 and ia32 creates a RELEASES and a .nupkg file we
    // need to store the output files in separate directories
    outDir = path.join(outDir, arch)

    var muonInstaller = require('muon-winstaller')
    var resultPromise = muonInstaller.createWindowsInstaller({
      appDirectory: buildDir,
      outputDirectory: outDir,
      title: 'Brave',
      authors: 'Brave Software',
      loadingGif: 'res/brave_splash_installing.gif',
      setupIcon: 'res/brave_installer.ico',
      iconUrl: 'https://brave.com/favicon.ico',
      signWithParams: format('-a -fd sha256 -f "%s" -p "%s" -t http://timestamp.verisign.com/scripts/timstamp.dll', path.resolve(cert), certPassword),
      noMsi: true,
      exe: 'Brave.exe'
    })
    resultPromise.then(() => {
      cmds = [
        `mv ${outDir}/Setup.exe ${outDir}/BraveSetup-${arch}.exe`
      ]
      execute(cmds, {}, console.log.bind(null, 'done'))
    }, (e) => console.log(`No dice: ${e.message}`))
  })
} else if (isLinux) {
  console.log('Install with sudo dpkg -i dist/brave_' + VersionInfo.braveVersion + '_amd64.deb')
  console.log('Or install with sudo dnf install dist/brave_' + VersionInfo.braveVersion + '.x86_64.rpm')
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
      ' --arch x86_64' +
      ' --config res/linuxPackaging.json',
    // .tar.bz2 file
    'tar -jcvf dist/Brave.tar.bz2 ./Brave-linux-x64'
  ]
  execute(cmds, {}, (err) => {
    if (err) {
      raiseError('buildInstaller failed' + JSON.stringify(err))
      return
    }
    console.log('done')
  })
} else {
  raiseError('Installer not supported for platform: ' + process.platform)
}
