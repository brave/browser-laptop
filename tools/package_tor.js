const execute = require('./lib/execute')
const path = require('path')
const fs = require('fs')
const unzip = require('unzip')
const crypto = require('crypto')

/**
 * does a hash comparison on a file to a given hash
 */
const verifyChecksum = (file, hash) => {
  const filecontent = fs.readFileSync(file)
  return hash === crypto.createHash('sha512').update(filecontent).digest('hex')
}

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

const torS3Prefix = 'https://s3.us-east-2.amazonaws.com/demo-tor-binaries/'
var torPath = process.argv.slice(2)[0] // npm run package-tor torPath
if (torPath === undefined) {
  torPath = path.join('app', 'extensions', 'bin')
}

const torVersion = '0.3.2.10'
const braveVersion = '1'
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

// download the binary
const torBinary = path.join(torPath, 'tor')
const cmd = 'curl -o ' + torBinary + ' ' + torURL
execute([cmd], '', (err) => {
  if (err) {
    console.error('downloading tor failed', err)
    process.exit(1)
  }
  // verify the checksum
  if (!verifyChecksum(torBinary, sha512Tor)) {
    console.error('tor checksum verification failed', err)
    process.exit(1)
  }
  console.log('tor binary checksum matches')
  // unzip on windows
  if (isWindows) {
    fs.createReadStream(torBinary).pipe(unzip.Extract({ path: torPath }))
  }
  // make it executable
  fs.chmodSync(torBinary, 0o755)
  console.log('done')
})
