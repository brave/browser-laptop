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

var torVersion

if (isWindows) {
  // To-Do: https://github.com/brave/browser-laptop/issues/14291
  torVersion = '0.3.2.10'
} else {
  torVersion = '0.3.3.7'
}

const braveVersion = '4'
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
  sha512Tor = '12d14784724c71f573aeebeaeaa22e39e271b565bc02cdd630d4d70da1b6ba9ffef61d4145735b8f7874abee08c67e6445cf854c877a9d69763332100c9dc293'
} else if (isLinux) {
  sha512Tor = '868c0f2c933445ca68f330ade872b66b6e2914eccd6b966c300f006468e921813eb7311345213d9e1546e85be400b7d2842506192b8d0ec125c3774c6e5c6d16'
} else {
  sha512Tor = 'bd25dcd1e6ca8c1048eaac584aa462a030a302d9f13e55d7f13f4003ec24b9e6ac1396fa62b2bda2dfbd1babed69fe205c605bf978c0779995f4817add84f981'
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
