/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
var ULID = require('ulid')

var storage = require('./storage')
var decryptEvents = require('./decrypt-events')

module.exports = new DecryptingStorage(storage)
module.exports.EventStore = DecryptingStorage

// This class is currently not in use and is just used to make sure
// the functionality AggregatingStorage remains entirely optional. This
// can be tested by swapping out instances of that class with instances of
// DecryptingStorage, seeing the same results, albeit a lot slower.
function DecryptingStorage (storage) {
  _.extend(this, storage)

  this.getEvents = function (account, lowerBound, upperBound) {
    var accountId = account && account.accountId
    var lowerBoundAsId = lowerBound && toLowerBound(lowerBound)
    var upperBoundAsId = upperBound && toUpperBound(upperBound)
    if (!accountId) {
      return storage.getRawEvents(accountId, lowerBoundAsId, upperBoundAsId)
    }

    var privateJwk = account && account.privateJwk

    return Promise.all([
      storage.getRawEvents(
        accountId,
        lowerBoundAsId,
        upperBoundAsId
      ),
      storage.getEncryptedSecrets(accountId)
    ]).then(function (results) {
      var encryptedEvents = results[0]
      var encryptedSecrets = results[1]
      return decryptEvents(encryptedEvents, encryptedSecrets, privateJwk)
    })
  }
}

module.exports.toUpperBound = toUpperBound
function toUpperBound (date) {
  return ULID.ulid(date.getTime() + 1)
}

module.exports.toLowerBound = toLowerBound
function toLowerBound (date) {
  return ULID.ulid(date.getTime() - 1)
}
