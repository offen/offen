/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var bindCrypto = require('./bind-crypto')
var storage = require('./storage')

var DEFAULT_KEY = {
  alg: 'A128GCM',
  ext: true,
  k: 'YDBxbV-KrqdM_MGoFpt1Tg',
  key_ops: [
    'encrypt',
    'decrypt'
  ],
  kty: 'oct'
}

module.exports = IndexedDBDecryptionCache

function IndexedDBDecryptionCache (accountId) {
  var self = this
  var cache = null
  var dirty = false

  var init = storage.getDecryptionCache(accountId)
    .then(bindCrypto(function (encryptedBlob) {
      if (!encryptedBlob) {
        return '{}'
      }
      var crypto = this
      return crypto.decryptSymmetricWith(DEFAULT_KEY)(encryptedBlob)
    }))
    .then(function (cacheString) {
      return JSON.parse(cacheString)
    })
    .then(function (initialCache) {
      cache = initialCache
    })

  this.get = ready(function (key) {
    return cache[key]
  })

  this.set = ready(function (key, value) {
    dirty = true
    cache[key] = value
  })

  this.commit = ready(bindCrypto(function () {
    if (!dirty) {
      return
    }
    var crypto = this
    var data = JSON.stringify(cache)
    return crypto.encryptSymmetricWith(DEFAULT_KEY)(data)
      .then(function (encryptedBlob) {
        dirty = false
        return storage.setDecryptionCache(accountId, encryptedBlob)
      })
  }))

  function ready (method) {
    return function () {
      var args = [].slice.call(arguments)
      return init.then(function () {
        return method.apply(self, args)
      })
    }
  }
}
