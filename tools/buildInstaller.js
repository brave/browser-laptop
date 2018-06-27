var VersionInfo = require('./lib/versionInfo')
var execute = require('./lib/execute')
var format = require('util').format
var path = require('path')
var fs = require('fs')

const fileExists = (path) => new Promise((resolve, reject) => fs.access(path, (err, exists) => {
  resolve(!err)
}))
const execPromise = (cmd) => new Promise((resolve, reject) => {
  execute(cmd, {}, err => {
    if (err) return reject(err)
    resolve()
  })
})

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
var outDir = 'dist'
var arch = 'x64'
var cmds

if (isWindows) {
  if (process.env.TARGET_ARCH === 'ia32') {
    arch = 'ia32'
  }
}

const channel = process.env.CHANNEL

var channels = { nightly: true, developer: true, beta: true, dev: true }
if (!channels[channel]) {
  throw new Error('CHANNEL environment variable must be set to nightly, developer, beta or dev')
}

var appName
switch (channel) {
  case 'nightly':
    appName = 'Brave-Nightly'
    break
  case 'developer':
    appName = 'Brave-Ads-Trial'
    break
  case 'beta':
    appName = 'Brave-Beta'
    break
  case 'dev':
    appName = 'Brave'
    break
  default:
    throw new Error('CHANNEL environment variable must be set to nightly, developer, beta or dev')
}

var tarName
if (isLinux) {
  tarName = appName
  appName = appName.toLowerCase()
}

if (isWindows) {
  appName = appName.replace(/-/g, '')
}

const buildDir = appName + '-' + process.platform + '-' + arch

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

  const wvBundle = buildDir + `/${appName}.app/Contents/Frameworks/Brave Framework.framework/Brave Framework`
  const wvBundleDir = buildDir + `/${appName}.app/Contents/Frameworks/Widevine Resources.bundle`
  const wvContents = wvBundleDir + '/Contents'
  const wvResources = wvContents + '/Resources'
  const wvBundleSig = wvResources + '/Brave Framework.sig'
  // choose pkg or dmg based on channel
  cmds = [
    // Remove old
    'rm -f ' + outDir + `/${appName}.dmg`,
    'rm -f ' + outDir + `/${appName}.pkg`,

    // sign for widevine
    'mkdir -p "' + wvResources + '"',
    'cp ' + buildDir + `/${appName}.app/Contents/Info.plist "` + wvContents + '"',
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER "' + wvBundle + '"',
    'python tools/signature_generator.py --input_file "' + wvBundle + '" --output_file "' + wvBundleSig + '" --flag 1',

    // Sign it (requires Apple 'Developer ID Application' certificate installed in keychain)
    'cd ' + buildDir + `/${appName}.app/Contents/Frameworks`,
    'codesign --deep --force --strict --verbose --sign $IDENTIFIER *',
    'cd ../../..',
    `codesign --deep --force --strict --verbose --sign $IDENTIFIER ${appName}.app/`,

    // Package it into a dmg and/or package
    'cd ..',
    'build ' +
      `--prepackaged="${buildDir}/${appName}.app" ` +
      `--config=res/${channel}/builderConfig.json ` +
      '--publish=never',

    // Create an update zip
    'ditto -c -k --sequesterRsrc --keepParent ' + buildDir + `/${appName}.app dist/${appName}-` + VersionInfo.braveVersion + '.zip'
  ]
  execute(cmds, {}, async (err) => {
    if (err) {
      raiseError('building installer failed: ' + JSON.stringify(err))
      return
    }

    // sign pkg if it exists (requires Apple 'Developer ID Installer' certificate installed in keychain)
    const fileName = `${appName}-${VersionInfo.braveVersion}`
    const packagePath = path.join(outDir, `${fileName}.pkg`)
    const packagePathUnsigned = path.join(outDir, `${fileName}_unsigned.pkg`)

    const pkgExists = await fileExists(packagePath)
    if (pkgExists) {
      console.log(`Signing pkg at ${packagePath}`)
      try {
        await execPromise([
          `mv ${packagePath} ${packagePathUnsigned}`,
          `productsign --sign ${identifier} ${packagePathUnsigned} ${packagePath}`,
          `rm ${packagePathUnsigned}`
        ])
        console.log(`pkg signing complete`)
      } catch (e) {
        console.error('Error signing pkg:')
        raiseError(e)
        return
      }
    }
    console.log('done')
  })
} else if (isWindows) {
  // a cert file must be present to sign the created package
  // a password MUST be passed as the CERT_PASSWORD environment variable
  var cert = process.env.CERT || '../brave-authenticode.pfx'
  var certPassword = process.env.CERT_PASSWORD
  if (!certPassword) {
    raiseError('Certificate password required. Set environment variable CERT_PASSWORD.')
  }

  const getSignCmd = (file) => {
    // https://docs.microsoft.com/en-us/dotnet/framework/tools/signtool-exe
    const signtool = '"C:/Program Files (x86)/Windows Kits/10/bin/x86/signtool"'
    return signtool + ' sign /fd sha256 /f "' +
      path.resolve(cert) + '" /p "' + certPassword + '" ' + file
  }

  // sign for widevine
  const wvExe = buildDir + `/${appName}.exe`
  cmds = [
    getSignCmd(wvExe),
    'python tools/signature_generator.py --input_file "' + wvExe + '" --flag 1'
  ]
  execute(cmds, {}, (err) => {
    if (err) {
      raiseError('signing for widevine failed: ' + JSON.stringify(err))
      return
    }

    // Because both x64 and ia32 creates a RELEASES and a .nupkg file we
    // need to store the output files in separate directories
    outDir = path.join(outDir, arch)

    const splashKey = channel === 'developer' ? '_dev' : ''
    var muonInstaller = require('muon-winstaller')
    var resultPromise = muonInstaller.createWindowsInstaller({
      appDirectory: buildDir,
      outputDirectory: outDir,
      title: appName,
      name: appName,
      authors: 'Brave Software',
      loadingGif: `res/brave_splash_installing${splashKey}.gif`,
      setupIcon: `res/${channel}/brave_installer.ico`,
      iconUrl: `https://raw.githubusercontent.com/brave/browser-laptop/master/res/${channel}/app.ico`,
      signWithParams: format('-a -fd sha256 -f "%s" -p "%s"', path.resolve(cert), certPassword),
      noMsi: true,
      exe: `${appName}.exe`,
      setupExe: `${appName}Setup-${arch}.exe`
    })
    resultPromise.then(() => {
      console.log('done')
    }, (e) => console.log(`No dice: ${e.message}`))
  })
} else if (isLinux) {
  console.log(`Install with sudo dpkg -i dist/${appName}_` + VersionInfo.braveVersion + '_amd64.deb')
  console.log(`Or install with sudo dnf install dist/${appName}_` + VersionInfo.braveVersion + '.x86_64.rpm')
  cmds = [
    // .deb file
    'electron-installer-debian' +
      ` --src ${appName}-linux-x64/` +
      ' --dest dist/' +
      ' --arch amd64' +
      ` --config res/${channel}/linuxPackaging.json`,
    // .rpm file
    'electron-installer-redhat' +
      ` --src ${appName}-linux-x64/` +
      ' --dest dist/' +
      ' --arch x86_64' +
      ` --config res/${channel}/linuxPackaging.json`,
    // OpenSuse .rpm file
    'electron-installer-redhat' +
      ` --src ${appName}-linux-x64/` +
      ' --dest dist/suse/' +
      ' --arch x86_64' +
      ` --config res/${channel}/suse.json`,
    // .tar.bz2 file
    `tar -jcvf dist/${tarName}.tar.bz2 ./${appName}-linux-x64`
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
