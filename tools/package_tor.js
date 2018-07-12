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

const torVersion = '0.3.3.8'
const braveVersion = '5'
const exeSuffix = isWindows ? '.exe' : ''
const torURL = torS3Prefix + 'tor-' + torVersion + '-' + process.platform + '-brave-' + braveVersion + exeSuffix

// mkdir -p doesn't work well with Windows
if (!fs.existsSync(torPath)) {
  fs.mkdirSync(torPath)
}

var sha512Tor
if (isDarwin) {
  sha512Tor = '1a578a544ba259a9de11a63ef24f867bb7efbf7df4cd45dd08b9fff775f3b7f39eacd699c25fab22d69d4bee25bc03e9977a5cc66416792281276d584c101a5f'
} else if (isLinux) {
  sha512Tor = '193f01b75123debf90b3e35d0bc731f9e59cc06cd4e2869123f133f3a5f5c1796150b536c3cca50a9579c03f90084e5052d3ca385f807eac191f46348a57dce1'
} else {
  sha512Tor = '7ba514fdd5f184015d65bbb65c82475dc256d23078dd3f7d115b4e2b93bf73ceedfbca89eed1baf501bddcdb7f5c81f384e02836588d067c01c3f469b0664885'
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
