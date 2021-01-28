/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('underscore')
const ULID = require('ulid')

const storage = require('./storage')
const decryptEvents = require('./decrypt-events')

module.exports = new DecryptingStorage(storage)
module.exports.EventStore = DecryptingStorage

// This class is currently not in use and is just used to make sure
// the functionality in AggregatingStorage remains entirely optional. This
// can be tested by swapping out instances of that class with instances of
// DecryptingStorage, seeing the same results, albeit slower.
function DecryptingStorage (storage) {
  _.extend(this, storage)

  this.getEvents = function (account, lowerBound, upperBound) {
    const accountId = account && account.accountId
    const lowerBoundAsId = lowerBound && toLowerBound(lowerBound)
    const upperBoundAsId = upperBound && toUpperBound(upperBound)
    if (!accountId) {
      return storage.getRawEvents(accountId, lowerBoundAsId, upperBoundAsId)
    }

    const privateJwk = account && account.privateJwk

    return Promise.all([
      storage.getRawEvents(
        accountId,
        lowerBoundAsId,
        upperBoundAsId
      ),
      storage.getEncryptedSecrets(accountId)
    ]).then(function (results) {
      const encryptedEvents = results[0]
      const encryptedSecrets = results[1]
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
