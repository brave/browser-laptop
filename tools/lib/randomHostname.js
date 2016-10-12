const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const _chooseRandomLetter = function () {
  return ALPHABET[Math.round(Math.random() * (ALPHABET.length - 1))]
}

const _generateRandomString = function (len) {
  return (new Array(len)).fill(null).map(_chooseRandomLetter).join('')
}

const TLDS = ['com', 'net', 'org', 'io', 'info']

const generateRandomHostname = function (maxLength, minLength) {
  maxLength = maxLength || 10
  minLength = minLength || 4

  let tld = TLDS[Math.round(Math.random() * (TLDS.length - 1))]

  let numParts = Math.round(Math.random()) + 1

  let host = (new Array(numParts)).fill(null).map(function () {
    let partLen = Math.max(Math.round(Math.random() * maxLength), minLength)
    return _generateRandomString(partLen)
  }).join('.') + '.' + tld

  return host
}

module.exports = generateRandomHostname
