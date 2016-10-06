/* global describe, it */
const CryptoUtil = require('../../../js/lib/cryptoUtil')
const assert = require('assert')

require('../braveUnit')

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
  it('decryption fails with wrong IV', function () {
    let message = 'hello world'
    let key = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
    let encrypted = CryptoUtil.encryptAuthenticate(message, key)
    assert.equal(null, CryptoUtil.decryptVerify(encrypted.content, encrypted.tag, key,
                                                CryptoUtil.getRandomBytes(12)))
  })
  // Try some test vectors from
  // http://csrc.nist.gov/groups/ST/toolkit/BCM/documents/proposedmodes/gcm/gcm-revised-spec.pdf

  // fails with Error: Unsupported state or unable to authenticate data
  it.skip('passes NIST Test Case 13', function () {
    let K = '0000000000000000000000000000000000000000000000000000000000000000'
    let P = ''
    let IV = '000000000000000000000000'
    let encrypted = CryptoUtil.encryptAuthenticateInternal(
      new Buffer(P, 'hex'),
      new Buffer(K, 'hex'),
      new Buffer(IV, 'hex'),
      undefined,
      'hex'
    )
    let decrypted = CryptoUtil.decryptVerifyInternal(
      new Buffer('', 'hex'), new Buffer(K, 'hex'), new Buffer(IV, 'hex'), undefined,
      new Buffer('530f8afbc74536b9a963b4f1c4cb738b', 'hex'), 'binary'
    )
    assert.equal(encrypted.ciphertext, '')
    assert.equal(encrypted.tag, '530f8afbc74536b9a963b4f1c4cb738b')
    assert.equal(decrypted, P)
  })
  it('passes NIST Test Case 14', function () {
    let K = '0000000000000000000000000000000000000000000000000000000000000000'
    let P = '00000000000000000000000000000000'
    let IV = '000000000000000000000000'
    let encrypted = CryptoUtil.encryptAuthenticateInternal(
      new Buffer(P, 'hex'),
      new Buffer(K, 'hex'),
      new Buffer(IV, 'hex'),
      undefined,
      'hex'
    )
    assert.equal(encrypted.ciphertext, 'cea7403d4d606b6e074ec5d3baf39d18')
    assert.equal(encrypted.tag, 'd0d1c8a799996bf0265b98b5d48ab919')
  })
  it('passes NIST Test Case 15', function () {
    let K = 'feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308'
    let P = 'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255'
    let IV = 'cafebabefacedbaddecaf888'
    let encrypted = CryptoUtil.encryptAuthenticateInternal(
      new Buffer(P, 'hex'),
      new Buffer(K, 'hex'),
      new Buffer(IV, 'hex'),
      undefined,
      'hex'
    )
    assert.equal(encrypted.ciphertext, '522dc1f099567d07f47f37a32a84427d' +
                 '643a8cdcbfe5c0c97598a2bd2555d1aa' +
                 '8cb08e48590dbb3da7b08b1056828838' +
                 'c5f61e6393ba7a0abcc9f662898015ad')
    assert.equal(encrypted.tag, 'b094dac5d93471bdec1a502270e3cc6c')
  })
  it('passes NIST Test Case 16', function () {
    let K = 'feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308'
    let P = 'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b39'
    let IV = 'cafebabefacedbaddecaf888'
    let A = 'feedfacedeadbeeffeedfacedeadbeefabaddad2'
    let encrypted = CryptoUtil.encryptAuthenticateInternal(
      new Buffer(P, 'hex'),
      new Buffer(K, 'hex'),
      new Buffer(IV, 'hex'),
      new Buffer(A, 'hex'),
      'hex'
    )
    let decrypted = CryptoUtil.decryptVerifyInternal(
      new Buffer('522dc1f099567d07f47f37a32a84427d643a8cdcbfe5c0c97598a2bd2555d1aa8cb08e48590dbb3da7b08b1056828838c5f61e6393ba7a0abcc9f662', 'hex'),
      new Buffer(K, 'hex'), new Buffer(IV, 'hex'), new Buffer(A, 'hex'),
      new Buffer('76fc6ece0f4e1768cddf8853bb2d551b', 'hex'), 'binary'
    )
    assert.equal(encrypted.ciphertext, '522dc1f099567d07f47f37a32a84427d643a8cdcbfe5c0c97598a2bd2555d1aa8cb08e48590dbb3da7b08b1056828838c5f61e6393ba7a0abcc9f662')
    assert.equal(encrypted.tag, '76fc6ece0f4e1768cddf8853bb2d551b')
    assert.equal(P, new Buffer(decrypted, 'binary').toString('hex'))
  })
})
