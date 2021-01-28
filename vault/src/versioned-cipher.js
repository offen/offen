/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const Unibabel = require('unibabel').Unibabel

const cipherRE = /{(\d+?),(\d*?)}\s(.+)/

exports.deserialize = deserializeCipher

function deserializeCipher (cipher) {
  const match = cipher.match(cipherRE)
  if (!match) {
    return { error: new Error('Could not match given cipher "' + cipher + '"') }
  }

  const chunks = match[3].split(' ')
  let cipherBytes = null
  let nonceBytes = null

  try {
    cipherBytes = Unibabel.base64ToArr(chunks[0])
  } catch (err) {
    return { error: err }
  }

  if (chunks[1]) {
    try {
      nonceBytes = Unibabel.base64ToArr(chunks[1])
    } catch (err) {
      return { error: err }
    }
  }

  return {
    algoVersion: parseInt(match[1], 10),
    keyVersion: match[2] ? parseInt(match[2], 10) : null,
    cipher: cipherBytes,
    nonce: nonceBytes
  }
}

exports.serialize = serializeCipher

function serializeCipher (cipher, nonce, algoVersion, keyVersion) {
  const keyRepr = keyVersion || ''
  const chunks = ['{' + algoVersion + ',' + keyRepr + '}', encodeEncrypted(cipher)]
  if (nonce) {
    chunks.push(encodeEncrypted(nonce))
  }
  return chunks.join(' ')
}

function encodeEncrypted (encrypted) {
  return Unibabel.arrToBase64(new Uint8Array(encrypted))
}
