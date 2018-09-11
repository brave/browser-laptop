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

const torVersion = '0.3.4.8'
const braveVersion = '6'
const exeSuffix = isWindows ? '.exe' : ''
const torURL = torS3Prefix + 'tor-' + torVersion + '-' + process.platform + '-brave-' + braveVersion + exeSuffix

// mkdir -p doesn't work well with Windows
if (!fs.existsSync(torPath)) {
  fs.mkdirSync(torPath)
}

var sha512Tor
if (isDarwin) {
  sha512Tor = 'ecd26c84a95785475ff4a53852716b99df7c73b041b755973041cee295e91fe809862537ebb9cc093c83e56d4bc58b56843fddae357fbdd05eef34e9e3094f05'
} else if (isLinux) {
  sha512Tor = '18cd93d74929e89cb668442b1a405d1a90e9bef81bf0fb046234054b3a86e0aaa0eb4ffbbe739af2f4af342c04d7871458028f0609b3942d8e1c0211d4a5b899'
} else {
  sha512Tor = '1a2247bebd8fb02a08c8bd6661ba1b98b179abd46f2b6ab930bc91c80c88b1b82dfa212ef0f89d8ccd6e971e29a7cdfce809929188b3bc7eddcd537583ba5c74'
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
