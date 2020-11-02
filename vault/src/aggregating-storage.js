/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
var ULID = require('ulid')
var startOfHour = require('date-fns/start_of_hour')
var endOfHour = require('date-fns/end_of_hour')

var storage = require('./storage')
var decryptEvents = require('./decrypt-events')
var bindCrypto = require('./bind-crypto')
var eventSchema = require('./event.schema')
var payloadSchema = require('./payload.schema')
var compression = require('./compression')

var supportsCompression = compression.supported()
var compressionThreshold = 1024

module.exports = new AggregatingStorage(storage)
module.exports.EventStore = AggregatingStorage

// AggregatingStorage adds aggregation logic on top of the plain atomic
// Storage that reads from IndexedDB. Consumers should not be affected by
// implementation details, but expect plain lists of events to be returned.
function AggregatingStorage (storage) {
  _.extend(this, storage)

  var aggregatesCache = new LockedAggregatesCache()
  var aggregationSecrets = {}

  function ensureAggregationSecret (accountId, publicKey, privateJwk) {
    if ((!publicKey || !privateJwk) && !aggregationSecrets[accountId]) {
      throw new Error('Could not find matching aggregation secret for account "' + accountId + '".')
    }

    aggregationSecrets[accountId] = aggregationSecrets[accountId] || storage.getAggregationSecret(accountId)
      .then(bindCrypto(function (secret) {
        var crypto = this
        if (secret) {
          return crypto.decryptAsymmetricWith(privateJwk)(secret)
        }
        var cryptoKey
        return crypto.createSymmetricKey()
          .then(function (_cryptoKey) {
            cryptoKey = _cryptoKey
            return crypto.encryptAsymmetricWith(publicKey)(cryptoKey)
          })
          .then(function (encryptedSecret) {
            return storage.putAggregationSecret(accountId, encryptedSecret)
          })
          .then(function () {
            return cryptoKey
          })
      }))
    return aggregationSecrets[accountId]
  }

  this.getEvents = function (account, lowerBound, upperBound) {
    var accountId = account && account.accountId
    var privateJwk = account && account.privateJwk
    var publicKey = account && account.publicKey
    var result
    var lowerBoundAsId = lowerBound && toLowerBound(lowerBound)
    var upperBoundAsId = upperBound && toUpperBound(upperBound)
    if (!accountId) {
      result = storage.getRawEvents(accountId, lowerBoundAsId, upperBoundAsId)
    } else {
      var accountCache
      var encryptedEvents
      var encryptAggregate
      var encryptedSecrets
      var aggregationSecret

      result = ensureAggregationSecret(accountId, publicKey, privateJwk)
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
              accountCache = _accountCache
              return results
            })
        })
        .then(bindCrypto(function (results) {
          var crypto = this
          encryptedEvents = results[0]
          var encryptedAggregates = results[1]
          encryptedSecrets = results[2]
          var decryptAggregate = crypto.decryptSymmetricWith(aggregationSecret)
          // an aggregate is JSON.stringified before passing it to the encryption
          // function as compression happens depending on the raw string size
          encryptAggregate = crypto.encryptSymmetricWith(aggregationSecret, _.identity)

          var timestampsInDb = _.pluck(encryptedAggregates, 'timestamp')
          var timestampsInCache = _.keys(accountCache)
          var missing = _.difference(timestampsInDb, timestampsInCache)
          var missingAggregates = _.filter(encryptedAggregates, function (agg) {
            return _.contains(missing, agg.timestamp)
          })
          return Promise.all(_.map(missingAggregates, function (aggregate) {
            return decryptAggregate(aggregate.value, aggregate.compressed)
              .then(function (decryptedValue) {
                return _.extend(aggregate, { value: decryptedValue })
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
          var eventIds = _.pluck(eventsFromExistingAggregates, 'eventId')
          var encryptedEventIds = _.pluck(encryptedEvents, 'eventId')
          var missingEvents = _.filter(encryptedEvents, function (event) {
            return !_.contains(eventIds, event.eventId)
          })
          var extraneousIds = _.difference(eventIds, _.pluck(encryptedEvents, 'eventId'))
          var knownEvents = _.filter(eventsFromExistingAggregates, function (event) {
            return _.contains(encryptedEventIds, event.eventId)
          })

          return Promise.all([
            decryptEvents(missingEvents, encryptedSecrets, privateJwk),
            knownEvents,
            extraneousIds
          ])
        })
        .then(function (results) {
          var decryptedEvents = results[0]
          var events = results[1]
          var extraneousIds = results[2]
          var requiresUpdate = []
          var grouped = _.groupBy(decryptedEvents, function (event) {
            var time = ULID.decodeTime(event.eventId)
            return startOfHour(new Date(time)).toJSON()
          })
          _.each(grouped, function (value, timestamp) {
            var agg = aggregate(value, normalizeEvent)
            accountCache[timestamp] = accountCache[timestamp]
              ? mergeAggregates([agg, accountCache[timestamp]])
              : agg
            requiresUpdate.push(timestamp)
          })

          var deleted = _.groupBy(extraneousIds, function (eventId) {
            var time = ULID.decodeTime(eventId)
            return startOfHour(new Date(time)).toJSON()
          })
          _.each(deleted, function (eventIds, timestamp) {
            accountCache[timestamp] = removeFromAggregate(accountCache[timestamp], 'eventId', eventIds)
            requiresUpdate.push(timestamp)
          })

          var updates = _.map(requiresUpdate, function (timestamp) {
            if (!_.size(accountCache[timestamp])) {
              storage.deleteAggregate(accountId, timestamp)
              return
            }

            var asJsonString = JSON.stringify(accountCache[timestamp])
            var compress = supportsCompression &&
              asJsonString.length > compressionThreshold
            return encryptAggregate(asJsonString, compress)
              .then(function (encryptedAggregate) {
                storage.putAggregate(
                  accountId, timestamp, encryptedAggregate, compress
                )
              })
          })
          // returning the result does not require to wait for the updates to
          // happen as queries will do a single call only
          Promise.all(updates).then(function () {
            aggregatesCache.releaseCache(accountId, accountCache)
          })
          return decryptedEvents.concat(events)
        })
    }

    return result
      .then(function (events) {
        return _.compact(_.map(events, validateAndParseEvent))
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

module.exports.aggregate = aggregate
function aggregate (events, normalizeFn) {
  if (normalizeFn) {
    events = events.map(normalizeFn)
  }
  return _.reduce(events, function (acc, event) {
    var givenKeys = _.keys(event)
    var knownKeys = _.keys(acc)

    var currentLength = _.size(_.head(_.values(acc)))
    var newKeys = _.without.apply(_, [givenKeys].concat(knownKeys))
    _.each(newKeys, function (key) {
      acc[key] = _.times(currentLength, _.constant(null))
    })

    for (var key in event) {
      acc[key].push(event[key])
    }

    var missingKeys = _.difference(knownKeys, givenKeys)
    _.each(missingKeys, function (key) {
      acc[key].push(null)
    })
    return acc
  }, {})
}

module.exports.mergeAggregates = mergeAggregates
function mergeAggregates (aggregates) {
  return _.reduce(aggregates, function (acc, aggregate) {
    var givenKeys = _.keys(aggregate)
    var knownKeys = _.keys(acc)

    var currentLength = _.size(_.head(_.values(acc)))
    var newKeys = _.without.apply(_, [givenKeys].concat(knownKeys))
    _.each(newKeys, function (key) {
      acc[key] = _.times(currentLength, _.constant(null))
    })

    for (var key in aggregate) {
      acc[key] = acc[key].concat(aggregate[key])
    }

    var missingKeys = _.difference(knownKeys, givenKeys)
    var aggregateLength = _.size(_.head(_.values(aggregate)))
    _.each(missingKeys, function (key) {
      acc[key] = acc[key].concat(_.times(aggregateLength, _.constant(null)))
    })
    return acc
  }, {})
}

module.exports.inflateAggregate = inflateAggregate
function inflateAggregate (aggregate, denormalizeFn) {
  var lengths = _.map(_.values(aggregate), _.size)
  if (!lengths.length) {
    return []
  }

  if (Math.min.apply(Math, lengths) !== Math.max.apply(Math, lengths)) {
    throw new Error('Cannot inflate an aggregate where members are of different lengths.')
  }

  var pairs = _.pairs(aggregate)
  var result = _.reduce(pairs, function (acc, nextPair) {
    return _.map(nextPair[1], function (value, index) {
      var item = acc[index] || {}
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
  var indices = values.map(function (value) {
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

module.exports.validateAndParseEvent = validateAndParseEvent
function validateAndParseEvent (event) {
  if (!eventSchema(event) || !payloadSchema(event.payload)) {
    return null
  }
  var clone = JSON.parse(JSON.stringify(event))
  if (clone.payload.href) {
    clone.payload.href = normalizedURL(clone.payload.href)
  }
  if (clone.payload.rawHref) {
    clone.payload.rawHref = normalizedURL(clone.payload.rawHref)
  }
  if (clone.payload.referrer) {
    clone.payload.referrer = normalizedURL(clone.payload.referrer)
  }
  return clone
}

function normalizedURL (urlString) {
  var url = new window.URL(urlString)
  if (!/\/$/.test(url.pathname)) {
    url.pathname += '/'
  }
  return url
}

module.exports.LockedAggregatesCache = LockedAggregatesCache
function LockedAggregatesCache () {
  var cache = {}
  var locks = []

  this.acquireCache = function (key) {
    cache[key] = cache[key] || {}
    var pendingLock = _.head(locks)

    var resolveLock
    var lock = new Promise(function (resolve) {
      resolveLock = function () {
        resolve(cache[key])
      }
    })
    locks.unshift({ promise: lock, resolve: resolveLock })
    return (pendingLock && pendingLock.promise) || Promise.resolve(cache[key])
  }

  this.releaseCache = function (key, value) {
    if (key && value) {
      cache[key] = value
    }
    locks.pop().resolve()
  }
}
