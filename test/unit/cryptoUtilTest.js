/* global describe, it */
const CryptoUtil = require('../../js/lib/cryptoUtil')
const assert = require('assert')

describe('crypto util test', function () {
  it('gets random bytes', function () {
    assert.equal(CryptoUtil.getRandomBytes(256).length, 256)
  })
  it('throws if random bytes argument is not a number', function () {
    assert.throws(
      () => { CryptoUtil.getRandomBytes('') }
    )
  })
  it('encrypts and decrypts successfully', function () {
    let message = 'hello world'
    let key = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
    let encrypted = CryptoUtil.encryptAuthenticate(message, key)
    assert.equal(message, CryptoUtil.decryptVerify(encrypted.content, encrypted.tag, key, encrypted.iv))
  })
  it('decryption fails with wrong authentication tag', function () {
    let message = 'hello world'
    let tamperedMessage = 'i hate browsers'
    let key = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
    let encrypted = CryptoUtil.encryptAuthenticate(message, key)
    let wrongEncrypted = CryptoUtil.encryptAuthenticate(tamperedMessage, key)
    assert.equal(null, CryptoUtil.decryptVerify(encrypted.content, wrongEncrypted.tag, key, encrypted.iv))
  })
})
