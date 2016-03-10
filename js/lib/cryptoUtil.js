/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const crypto = require('crypto')

const AES_256_GCM = 'aes-256-gcm'

/**
 * Encrypts and integrity-protects some text using AES GCM 256
 * @param {string} text - utf8 encoded text to encrypt
 * @param {string} key - binary encoded secret key, 32 bytes
 * @return {{content: string, tag: string, iv: string}}
 */
module.exports.encryptAuthenticate = function (text, key) {
  var ivBuffer = module.exports.getRandomBytes(12)
  var iv = ivBuffer.toString('binary')
  var cipher = crypto.createCipheriv(AES_256_GCM, key, iv)
  cipher.setAAD(ivBuffer)
  var encrypted = cipher.update(text, 'utf8', 'binary')
  encrypted += cipher.final('binary')
  return {
    content: encrypted,
    tag: cipher.getAuthTag().toString('binary'),
    iv: iv
  }
}

/**
 * Decrypts and verifies text using AES GCM 256
 * @param {string} encrypted - binary string to decrypt
 * @param {string} authTag - binary-encoded authentication tag
 * @param {string} key - binary encoded secret key, 32 bytes
 * @param {string} iv - binary encoded IV, 12 bytes
 * @return {string|null}
 */
module.exports.decryptVerify = function (encrypted, authTag, key, iv) {
  try {
    let decipher = crypto.createDecipheriv(AES_256_GCM, key, iv)
    decipher.setAAD(new Buffer(iv, 'binary'))
    decipher.setAuthTag(new Buffer(authTag, 'binary'))
    let decrypted = decipher.update(encrypted, 'binary', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (e) {
    // node throws error if authentication fails
    console.log('got decryption failure', e)
    return null
  }
}

/**
 * Generates a buffer of N random bytes.
 * @param {number} size - number of bytes to generate
 * @return {Buffer}
 */
module.exports.getRandomBytes = function (size) {
  return crypto.randomBytes(size)
}
