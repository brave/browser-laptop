const execute = require('./lib/execute')
const path = require('path')
const fs = require('fs')
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

const torVersion = '0.3.3.7'
const braveVersion = '4'
const exeSuffix = isWindows ? '.exe' : ''
const torURL = torS3Prefix + 'tor-' + torVersion + '-' + process.platform + '-brave-' + braveVersion + exeSuffix

// mkdir -p doesn't work well with Windows
if (!fs.existsSync(torPath)) {
  fs.mkdirSync(torPath)
}

var sha512Tor
if (isDarwin) {
  sha512Tor = '12d14784724c71f573aeebeaeaa22e39e271b565bc02cdd630d4d70da1b6ba9ffef61d4145735b8f7874abee08c67e6445cf854c877a9d69763332100c9dc293'
} else if (isLinux) {
  sha512Tor = '868c0f2c933445ca68f330ade872b66b6e2914eccd6b966c300f006468e921813eb7311345213d9e1546e85be400b7d2842506192b8d0ec125c3774c6e5c6d16'
} else {
  sha512Tor = 'e903df0f7de750e65dc0509fa2a7237b8f69964e34b41aa23f6bf89579202e27ff00df7bb639d4676fbf569baf0fa95acef9192212c6093303baa6468d4affc5'
}

// download the binary
const torBinary = path.join(torPath, 'tor' + exeSuffix)
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
  // make it executable
  fs.chmodSync(torBinary, 0o755)
  console.log('done')
})
