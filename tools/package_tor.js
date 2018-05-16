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
const braveVersion = '2'
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
  sha512Tor = '85f70d32dc3e1439a198f2119d7c4712ff2fdd4219eed38684bb2b5e5b2d3dc7eebb785718f1631eacf748d70e170f952b6d8ce16a16f9fbbcfc816b0d5644d7'
} else if (isLinux) {
  sha512Tor = 'c23ddcfdc3b48c642ed014679f9b9a4fc83ab997cf64482070b6a8caf27aa37fd61e014ea54c57eac5e527e11129b7620d1a5d002aaf5549966e3fa8cc72bc8b'
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
