/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const crypto = require('crypto')

const AES_256_GCM = 'aes-256-gcm'
const DEFAULT_ENCODING = 'binary' // encoding of ciphertexts, iv's, keys, etc.
const PLAINTEXT_ENCODING = 'utf8' // encoding of encryption input and decryption output

/**
 * Encrypts and integrity-protects some text using AES GCM 256
 * @param {string} text - utf8 encoded text to encrypt
 * @param {string} key - binary encoded secret key, 32 bytes
 * @return {{content: string, tag: string, iv: string}}
 */
module.exports.encryptAuthenticate = function (text, key) {
  var iv = module.exports.getRandomBytes(12)
  var encrypted = module.exports.encryptAuthenticateInternal(
    new Buffer(text, PLAINTEXT_ENCODING),
    new Buffer(key, DEFAULT_ENCODING),
    iv,
    iv,
    DEFAULT_ENCODING
  )
  return {
    content: encrypted.ciphertext,
    tag: encrypted.tag,
    iv: iv.toString(DEFAULT_ENCODING)
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
    let ivBuffer = new Buffer(iv, DEFAULT_ENCODING)
    return module.exports.decryptVerifyInternal(
      new Buffer(encrypted, DEFAULT_ENCODING),
      new Buffer(key, DEFAULT_ENCODING),
      ivBuffer,
      ivBuffer,
      new Buffer(authTag, DEFAULT_ENCODING),
      PLAINTEXT_ENCODING
    )
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

/**
 * Encrypts and integrity-protects some data using AES GCM 256
 * @param {Buffer} pdata - plaintext data to encrypt
 * @param {Buffer} key - secret key
 * @param {Buffer} iv - initialization vector
 * @param {Buffer|undefined} adata - additional authenticated data
 * @param {string} outputEncoding - 'hex', 'binary', or 'base64'
 * @return {{ciphertext: string, tag: string}}
 */
module.exports.encryptAuthenticateInternal = function (pdata, key, iv, adata, outputEncoding) {
  // Note that Node's GCM implementation only accepts 12 byte IV's
  var cipher = crypto.createCipheriv(AES_256_GCM, key, iv)
  if (adata) {
    cipher.setAAD(adata)
  }
  var encrypted = cipher.update(pdata, undefined, outputEncoding)
  encrypted += cipher.final(outputEncoding)
  return {
    ciphertext: encrypted,
    tag: cipher.getAuthTag().toString(outputEncoding)
  }
}

/**
 * Decrypts and verifies some data using AES GCM 256
 * @param {Buffer} ciphertext - ciphertext
 * @param {Buffer} key - secret key
 * @param {Buffer} iv - initialization vector
 * @param {Buffer|undefined} adata - additional authenticated data
 * @param {Buffer} tag - authentication tag
 * @param {string} outputEncoding - 'binary', 'ascii', 'utf8'
 * @return {string}
 */
module.exports.decryptVerifyInternal = function (ciphertext, key, iv, adata, tag, outputEncoding) {
  let decipher = crypto.createDecipheriv(AES_256_GCM, key, iv)
  if (adata) {
    decipher.setAAD(adata)
  }
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(ciphertext, undefined, outputEncoding)
  decrypted += decipher.final(outputEncoding)
  return decrypted
}
