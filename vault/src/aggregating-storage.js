/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('underscore')
const ULID = require('ulid')
const startOfHour = require('date-fns/start_of_hour')
const endOfHour = require('date-fns/end_of_hour')

const storage = require('./storage')
const decryptEvents = require('./decrypt-events')
const bindCrypto = require('./bind-crypto')
const compression = require('./compression')

const supportsCompression = compression.supported()
const compressionThreshold = 1024

module.exports = new AggregatingStorage(storage)
module.exports.AggregatingStorage = AggregatingStorage

// AggregatingStorage adds aggregation logic on top of the plain atomic
// Storage that reads from IndexedDB. Consumers should not be affected by
// implementation details, but expect plain lists of events to be returned.
//
// In order to prevent conflicting updates on read, write and delete, aggregates
// are materialized on read only, using the following procedure:
// 1. all relevant events for the given query are looked up in their encrypted
//    form
// 2. all relevant aggregates for the given query are looked up in memory
// 3. aggregates that are not present in memory yet, but are present in the
//    local database are retrieved, decrypted and added to the in-memory cache
// 4. comparing the updated in-memory aggregates and the list of encrypted
//    events allows us to compute a list of event ids that are missing from
//    the aggregates
// 5. the missing events are decrypted and added to the in-memory aggregates
// 6. the in-memory aggregates are encrypted and persisted to the local
//    database (this can happen after returning the result)
// 7. the list of relevant events for the query can be returned

function AggregatingStorage (storage) {
  _.extend(this, storage)

  const ensureAggregationSecret = ensureAggregationSecretWith(storage)
  const aggregatesCache = new LockedAggregatesCache()

  this.getEvents = function (account, lowerBound, upperBound) {
    const accountId = account && account.accountId
    const lowerBoundAsId = lowerBound && toLowerBound(lowerBound)
    const upperBoundAsId = upperBound && toUpperBound(upperBound)
    if (!accountId) {
      return storage.getRawEvents(accountId, lowerBoundAsId, upperBoundAsId)
    }

    const privateJwk = account && account.privateJwk
    const publicJwk = account && account.publicJwk
    let accountCache
    let encryptedEvents
    let encryptAggregate
    let encryptedSecrets
    let aggregationSecret
    let releaseCache

    return ensureAggregationSecret(accountId, publicJwk, privateJwk)
      .then(function (_aggregationSecret) {
        aggregationSecret = _aggregationSecret
        return Promise.all([
          storage.getRawEvents(
            accountId,
            lowerBoundAsId,
            upperBoundAsId
          ),
          storage.getAggregates(
            accountId,
            lowerBound && startOfHour(lowerBound).toJSON(),
            upperBound && endOfHour(upperBound).toJSON()
          ),
          storage.getEncryptedSecrets(accountId)
        ])
      })
      .then(function (results) {
        return aggregatesCache.acquireCache(accountId)
          .then(function (_accountCache) {
            accountCache = _accountCache.cache
            releaseCache = _accountCache.release
            return results
          })
      })
      .then(bindCrypto(function (results) {
        const crypto = this
        encryptedEvents = results[0]
        const encryptedAggregates = results[1]
        encryptedSecrets = results[2]
        const decryptAggregate = crypto.decryptSymmetricWith(aggregationSecret)
        // an aggregate is JSON.stringified before passing it to the encryption
        // function as compression happens depending on the raw string size
        encryptAggregate = crypto.encryptSymmetricWith(aggregationSecret, _.identity)

        const timestampsInDb = _.pluck(encryptedAggregates, 'timestamp')
        const timestampsInCache = _.keys(accountCache)
        const missing = _.difference(timestampsInDb, timestampsInCache)
        const missingAggregates = _.filter(encryptedAggregates, function (agg) {
          return _.contains(missing, agg.timestamp)
        })
        return Promise.all(_.map(missingAggregates, function (aggregate) {
          return decryptAggregate(aggregate.value, aggregate.compressed)
            .then(function (decryptedValue) {
              return _.extend(aggregate, { value: decryptedValue })
            }, function () {
              return _.extend(aggregate, { value: {} })
            })
        }))
      }))
      .then(function (decryptedAggregates) {
        _.each(decryptedAggregates, function (aggregate) {
          accountCache[aggregate.timestamp] = aggregate.value
        })
        return inflateAggregate(
          mergeAggregates(_.values(accountCache)), denormalizeEvent
        ).filter(function (event) {
          return lowerBoundAsId <= event.eventId && event.eventId <= upperBoundAsId
        })
      })
      .then(function (eventsFromExistingAggregates) {
        const eventIds = _.pluck(eventsFromExistingAggregates, 'eventId')
        const encryptedEventIds = _.pluck(encryptedEvents, 'eventId')
        const missingEvents = _.filter(encryptedEvents, function (event) {
          return !_.contains(eventIds, event.eventId)
        })
        const extraneousIds = _.difference(eventIds, _.pluck(encryptedEvents, 'eventId'))
        const knownEvents = _.filter(eventsFromExistingAggregates, function (event) {
          return _.contains(encryptedEventIds, event.eventId)
        })
        return Promise.all([
          decryptEvents(missingEvents, encryptedSecrets, privateJwk),
          knownEvents,
          extraneousIds
        ])
      })
      .then(function (results) {
        const decryptedEvents = results[0]
        const eventsFromAggregates = results[1]
        const extraneousEventIds = results[2]
        const requiresUpdate = []

        const grouped = _.groupBy(decryptedEvents, groupByUTC(_.property(['eventId'])))
        _.each(grouped, function (value, timestamp) {
          const agg = aggregate(value, normalizeEvent)
          accountCache[timestamp] = accountCache[timestamp]
            ? mergeAggregates([agg, accountCache[timestamp]])
            : agg
          requiresUpdate.push(timestamp)
        })

        const deleted = _.groupBy(extraneousEventIds, groupByUTC(_.identity))
        _.each(deleted, function (eventIds, timestamp) {
          accountCache[timestamp] = removeFromAggregate(
            accountCache[timestamp], 'eventId', eventIds
          )
          requiresUpdate.push(timestamp)
        })

        const updates = _.map(requiresUpdate, function (timestamp) {
          if (!_.size(accountCache[timestamp])) {
            return storage.deleteAggregate(accountId, timestamp)
          }

          const asJsonString = JSON.stringify(accountCache[timestamp])
          const compress = supportsCompression &&
            asJsonString.length > compressionThreshold
          return encryptAggregate(asJsonString, compress)
            .then(function (encryptedAggregate) {
              return storage.putAggregate(
                accountId, timestamp, encryptedAggregate, compress
              )
            })
            .catch(Function.prototype)
        })
        // returning the result does not require to wait for the updates to
        // happen as queries will do a single call only
        Promise.all(updates)
          .then(function () {
            releaseCache(accountId, accountCache)
          })
        return decryptedEvents.concat(eventsFromAggregates)
      })
  }
}

module.exports.ensureAggregationSecretWith = ensureAggregationSecretWith
function ensureAggregationSecretWith (storage, cache) {
  cache = cache || {}
  return function (accountId, publicJwk, privateJwk) {
    if ((!publicJwk || !privateJwk) && !cache[accountId]) {
      return Promise.reject(new Error(
        'Could not find matching aggregation secret for account "' + accountId + '".'
      ))
    }

    if (!cache[accountId]) {
      cache[accountId] = storage.getAggregationSecret(accountId)
        .then(bindCrypto(function (secret) {
          const crypto = this
          if (secret) {
            return crypto.decryptAsymmetricWith(privateJwk)(secret)
          }
          let cryptoKey
          return crypto.createSymmetricKey()
            .then(function (_cryptoKey) {
              cryptoKey = _cryptoKey
              return crypto.encryptAsymmetricWith(publicJwk)(cryptoKey)
            })
            .then(function (encryptedSecret) {
              return storage.putAggregationSecret(accountId, encryptedSecret)
            })
            .then(function () {
              return cryptoKey
            })
        }))
    }
    return cache[accountId]
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

module.exports.aggregate = aggregate
function aggregate (events, normalizeFn) {
  if (normalizeFn) {
    events = events.map(normalizeFn)
  }
  return _.reduce(events, function (acc, event) {
    const givenKeys = _.keys(event)
    const knownKeys = _.keys(acc)

    const currentLength = _.size(_.head(_.values(acc)))
    const newKeys = _.without.apply(_, [givenKeys].concat(knownKeys))
    _.each(newKeys, function (key) {
      acc[key] = _.times(currentLength, _.constant(null))
    })

    for (const key in event) {
      acc[key].push(event[key])
    }

    const missingKeys = _.difference(knownKeys, givenKeys)
    _.each(missingKeys, function (key) {
      acc[key].push(null)
    })
    return acc
  }, {})
}

module.exports.mergeAggregates = mergeAggregates
function mergeAggregates (aggregates) {
  return _.reduce(aggregates, function (acc, aggregate) {
    const givenKeys = _.keys(aggregate)
    const knownKeys = _.keys(acc)

    const currentLength = _.size(_.head(_.values(acc)))
    const newKeys = _.without.apply(_, [givenKeys].concat(knownKeys))
    _.each(newKeys, function (key) {
      acc[key] = _.times(currentLength, _.constant(null))
    })

    for (const key in aggregate) {
      acc[key] = acc[key].concat(aggregate[key])
    }

    const missingKeys = _.difference(knownKeys, givenKeys)
    const aggregateLength = _.size(_.head(_.values(aggregate)))
    _.each(missingKeys, function (key) {
      acc[key] = acc[key].concat(_.times(aggregateLength, _.constant(null)))
    })
    return acc
  }, {})
}

module.exports.inflateAggregate = inflateAggregate
function inflateAggregate (aggregate, denormalizeFn) {
  const lengths = _.map(_.values(aggregate), _.size)
  if (!lengths.length) {
    return []
  }

  if (Math.min.apply(Math, lengths) !== Math.max.apply(Math, lengths)) {
    throw new Error('Cannot inflate an aggregate where members are of different lengths.')
  }

  const pairs = _.pairs(aggregate)
  const result = _.reduce(pairs, function (acc, nextPair) {
    return _.map(nextPair[1], function (value, index) {
      const item = acc[index] || {}
      item[nextPair[0]] = value
      return item
    })
  }, [])
  if (denormalizeFn) {
    return result.map(denormalizeFn)
  }
  return result
}

module.exports.removeFromAggregate = removeFromAggregate
function removeFromAggregate (aggregate, keyRef, values) {
  const indices = values.map(function (value) {
    return _.indexOf(aggregate[keyRef], value)
  })
  return _.mapObject(aggregate, function (values) {
    return _.reduceRight(values, function (acc, value, index) {
      if (_.contains(indices, index)) {
        return acc
      }
      acc.unshift(value)
      return acc
    }, [])
  })
}

module.exports.normalizeEvent = normalizeEvent
function normalizeEvent (evt) {
  return Object.assign(
    _.pick(evt, 'accountId', 'eventId', 'secretId'),
    evt.payload
  )
}

module.exports.denormalizeEvent = denormalizeEvent
function denormalizeEvent (evt) {
  return Object.assign(
    _.pick(evt, 'accountId', 'eventId', 'secretId'),
    { payload: _.omit(evt, 'accountId', 'eventId', 'secretId') }
  )
}

module.exports.LockedAggregatesCache = LockedAggregatesCache
function LockedAggregatesCache () {
  const cache = {}
  const locks = []

  this.acquireCache = function (key) {
    cache[key] = cache[key] || {}
    const pendingLock = _.head(locks)
    let resolveLock
    const lock = new Promise(function (resolve) {
      resolveLock = function () {
        resolve({
          cache: cache[key],
          release: release
        })
      }
    })

    locks.unshift({ promise: lock, resolve: resolveLock })
    return (pendingLock && pendingLock.promise) || Promise.resolve({ cache: cache[key], release: release })

    function release (key, value) {
      if (key && value) {
        cache[key] = value
      }
      locks.pop().resolve()
    }
  }
}

function groupByUTC (mapFn) {
  return function (v) {
    const time = ULID.decodeTime(mapFn(v))
    return startOfHour(new Date(time)).toJSON()
  }
}
