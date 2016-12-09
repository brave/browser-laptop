var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
var format = require('util').format
var path = require('path')

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
var outDir = 'dist'
var arch = 'x64'
var cmds

if (process.env.TARGET_ARCH === 'ia32') {
  arch = 'ia32'
}

const buildDir = 'Brave-' + process.platform + '-' + arch

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
    'electron-builder "' + buildDir + '/Brave.app"' +
      ' --platform=osx ' +
      ' --out="' + outDir + '" ' +
      ' --config=res/builderConfig.json ' +
      ' --overwrite',

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
    throw new Error('Certificate password required. Set environment variable CERT_PASSWORD.')
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
    exe: 'Brave.exe'
  })
  resultPromise.then(() => {
    cmds = [
      `mv ${outDir}/Setup.exe ${outDir}/BraveSetup-${arch}.exe`,
      `mv ${outDir}/Setup.msi ${outDir}/BraveSetup-${arch}.msi`
    ]
    execute(cmds, {}, console.log.bind(null, 'done'))
  }, (e) => console.log(`No dice: ${e.message}`))
} else if (isLinux) {
  console.log(format('Install with sudo dpkg -i dist/brave_' + VersionInfo.braveVersion + '_%s.deb', arch))
  console.log(format('Or install with sudo dnf install dist/brave_' + VersionInfo.braveVersion + '.%s.rpm', arch))
  cmds = [
    // .deb file
    'electron-installer-debian' +
      format(' --src Brave-linux-%s/', arch) +
      ' --dest dist/' +
      format(' --arch %s', arch) +
      ' --config res/linuxPackaging.json',
    // .rpm file
    'electron-installer-redhat' +
      format(' --src Brave-linux-%s/', arch) +
      ' --dest dist/' +
      format(' --arch %s', arch) +
      ' --config res/linuxPackaging.json',
    // .tar.bz2 file
    format('tar -jcvf dist/Brave.tar.bz2 ./Brave-linux-%s', arch)
  ]
  execute(cmds, {}, console.log.bind(null, 'done'))
} else {
  console.log('Installer not supported for platform: ' + process.platform)
  process.exit(1)
}

