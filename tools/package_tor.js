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
  torVersion = '0.3.3.6'
}

const braveVersion = '3'
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
  sha512Tor = '49c7bf2bb648faca53c578b69a8e85e6e817ddd5d9991cc3c61d6d445dcca8f4a745053a57f4093bb161168d1f5d6dba005a9d969a75c286013a37c273b3bb64'
} else if (isLinux) {
  sha512Tor = 'a93c447ede02df5ea5992c1d1c18ea16544b82513a0c8f21cd818c7724b2c489970c749444e5098f1c57f6e4db44106825ad23a41dbb277e2576d22ae38e6ea6'
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
