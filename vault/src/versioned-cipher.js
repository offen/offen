var Unibabel = require('unibabel').Unibabel

var cipherRE = /{(\d+?),(\d*?)}\s(.+)/

exports.deserialize = deserializeCipher

function deserializeCipher (cipher) {
  var match = cipher.match(cipherRE)
  if (!match) {
    return { error: new Error('Could not match given cipher "' + cipher + '"') }
  }

  var chunks = match[3].split(' ')
  var cipherBytes = null
  var nonceBytes = null

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
  var keyRepr = keyVersion || ''
  var chunks = ['{' + algoVersion + ',' + keyRepr + '}', encodeEncrypted(cipher)]
  if (nonce) {
    chunks.push(encodeEncrypted(nonce))
  }
  return chunks.join(' ')
}

function encodeEncrypted (encrypted) {
  return Unibabel.arrToBase64(new Uint8Array(encrypted))
}
