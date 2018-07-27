const crypto = require('brave-crypto')

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const _chooseRandomLetter = function () {
  return ALPHABET[crypto.random.uniform(ALPHABET.length)]
}

const _generateRandomString = function (len) {
  return (new Array(len)).fill(null).map(_chooseRandomLetter).join('')
}

const TLDS = ['com', 'net', 'org', 'io', 'info']

const generateRandomHostname = function (maxLength, minLength) {
  maxLength = maxLength || 10
  minLength = minLength || 4

  let tld = TLDS[crypto.random.uniform(TLDS.length)]

  let numParts = 1 + crypto.random.uniform(2)

  let host = (new Array(numParts)).fill(null).map(function () {
    let partLen = minLength + crypto.random.uniform(maxLength - minLength + 1)
    return _generateRandomString(partLen)
  }).join('.') + '.' + tld

  return host
}

module.exports = generateRandomHostname
