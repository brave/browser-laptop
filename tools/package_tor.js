var execute = require('./lib/execute')
const path = require('path')
const fs = require('fs')
const unzip = require('unzip')

var cmds = []

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

const torS3Prefix = 'https://s3.us-east-2.amazonaws.com/demo-tor-binaries/'
var torPath = process.argv.slice(2)[0] // npm run package-tor torPath
if (torPath === undefined) {
  torPath = path.join('app', 'extensions', 'bin')
}

var torVersion = '0.3.2.10'
var braveVersion = '1'
var torURL = torS3Prefix + 'tor-' + torVersion + '-' + process.platform + '-brave-' + braveVersion

if (isWindows) {
  torURL += '.zip'
}

// mkdir -p doesn't work well with Windows
if (!fs.existsSync(torPath)) {
  fs.mkdirSync(torPath)
}

var sha512Tor
if (isDarwin) {
  sha512Tor = 'af09b7f31fcb3996db3883dff0c20187fdb9653fb5d207dc7e8d3d8cd9de90f2908e47f4414c03b5633a94183425e0c9804316ece353f8174ec4897559932a4e'
} else if (isLinux) {
  sha512Tor = '8e78aa316aef74b6c68983cc3a82ec77e0805001faa1bc0bcf6458227af56929cdf9bd6d48626026aba5a48c82a71eaab15588a6c744b02c2e0be990e73e034b'
} else {
  sha512Tor = '0fbd88d590069fdc243fcdcc84b8aa10caa921fc11d7e776334f0cbd5b0095b21046adfd291be61dc414c232bc1ff22e7e8142b0af1d20e71154f8de66be83ab'
}

// Windows adds " " to the file, in mac/linux " " preserves the spaces between
// sha and file path
cmds.push('curl -o ' + path.join(torPath, 'tor') + ' ' + torURL)
if (isWindows) {
  cmds.push('echo ' + sha512Tor + '  ' + path.join(torPath, 'tor') + '> tor.hash')
} else {
  cmds.push('echo "' + sha512Tor + '  ' + path.join(torPath, 'tor') + '" > tor.hash')
}

if (isDarwin) {
  cmds.push('shasum -a 512 -c tor.hash')
} else {
  cmds.push('sha512sum -c tor.hash')
}

if (!isWindows) {
  cmds.push('chmod +x ' + path.join(torPath, 'tor'))
}
cmds.push('rm -f tor.hash')
execute(cmds, '', (err) => {
  if (err) {
    console.error('package tor failed', err)
    process.exit(1)
  }
  if (isWindows) {
    fs.createReadStream(path.join(torPath, 'tor')).pipe(unzip.Extract({ path: torPath }))
  }
  console.log('done')
})
