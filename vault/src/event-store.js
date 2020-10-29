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

module.exports = new EventStore(storage)
module.exports.EventStore = EventStore

function EventStore (storage) {
  var aggregationSecrets = {}
  this.ensureAggregationSecret = function (accountId, publicKey, privateJwk) {
    if (accountId === null) {
      return Promise.resolve(null)
    }

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

  var aggregatesCache = new LockedCache()

  this.putEvents = function (accountId, events, privateJwk) {
    return Promise.all([
      storage.putEvents(accountId, events),
      this.ensureAggregationSecret(accountId)
    ])
      .then(function (results) {
        if (!accountId) {
          return
        }
        var aggregationSecret = results[1]
        var accountCache
        return storage.getEncryptedSecrets(accountId)
          .then(function (encryptedSecrets) {
            return decryptEvents(events, encryptedSecrets, privateJwk)
          })
          .then(function (events) {
            return aggregatesCache.acquireCache(accountId)
              .then(bindCrypto(function (_accountCache) {
                accountCache = _accountCache
                var crypto = this
                var decryptAggregate = crypto.decryptSymmetricWith(aggregationSecret)
                var encryptAggregate = crypto.encryptSymmetricWith(aggregationSecret)

                return Promise.all(_.chain(events)
                  .groupBy(function (event) {
                    var time = ULID.decodeTime(event.eventId)
                    return startOfHour(new Date(time)).toJSON()
                  })
                  .pairs()
                  .map(function (pair) {
                    var timestamp = pair[0]
                    var events = pair[1]

                    var cachedItem = _.findWhere(accountCache, { timestamp: timestamp })
                    return Promise.resolve(cachedItem || storage.getAggregate(accountId, timestamp)
                      .then(function (encryptedAggregate) {
                        if (!encryptedAggregate) {
                          return null
                        }
                        return decryptAggregate(encryptedAggregate.value)
                          .then(function (decryptedValue) {
                            return _.extend(encryptedAggregate, { value: decryptedValue })
                          })
                      }))
                      .then(function (existingAggregate) {
                        var aggregated = aggregate(events, normalizeEvent)
                        if (existingAggregate) {
                          aggregated = mergeAggregates([existingAggregate, aggregated])
                        }
                        accountCache[timestamp] = aggregated
                        encryptAggregate(aggregated)
                          .then(function (encryptedAggregate) {
                            return storage.putAggregate(accountId, timestamp, encryptedAggregate)
                          })
                      })
                  }).value())
              }))
          })
          .then(function (result) {
            aggregatesCache.releaseCache(accountId, accountCache)
            return result
          })
      })
  }

  this.getEvents = function (accountId, lowerBound, upperBound) {
    var result
    var lowerBoundAsId = lowerBound && toLowerBound(lowerBound)
    var upperBoundAsId = upperBound && toUpperBound(upperBound)
    if (!accountId) {
      result = storage.getAllEvents(accountId, lowerBoundAsId, upperBoundAsId)
    } else {
      var accountCache
      result = aggregatesCache.acquireCache(accountId)
        .then(function (_accountCache) {
          accountCache = _accountCache
          return Promise.all([
            storage.getAggregates(
              accountId,
              lowerBound && startOfHour(lowerBound).toJSON(),
              upperBound && endOfHour(upperBound).toJSON()
            ),
            this.ensureAggregationSecret(accountId)
          ])
        }.bind(this))
        .then(bindCrypto(function (results) {
          var crypto = this
          var encryptedAggregates = results[0]
          var aggregationSecret = results[1]
          var decryptAggregate = crypto.decryptSymmetricWith(aggregationSecret)

          var timestampsInDb = _.pluck(encryptedAggregates, 'timestamp')
          var timestampsInCache = _.pluck(accountCache, 'timestamp')
          var missing = _.difference(timestampsInDb, timestampsInCache)
          var missingAggregates = _.filter(encryptedAggregates, function (agg) {
            return _.contains(missing, agg.timestamp)
          })
          if (!missingAggregates.length) {
            aggregatesCache.releaseCache()
          }

          return Promise.all(_.map(missingAggregates, function (aggregate) {
            return decryptAggregate(aggregate.value).then(function (decryptedValue) {
              return _.extend(aggregate, { value: decryptedValue })
            })
          }))
        }))
        .then(function (decryptedAggregates) {
          accountCache = accountCache.concat(decryptedAggregates)
          if (decryptedAggregates.length) {
            aggregatesCache.releaseCache(accountId, accountCache)
          }
          var values = _.pluck(accountCache, 'value')
          return inflateAggregate(mergeAggregates(values), denormalizeEvent)
        })
        .then(function (events) {
          return events.filter(function (event) {
            return lowerBoundAsId <= event.eventId && event.eventId <= upperBoundAsId
          })
        })
        .then(function (events) {
          return events
        })
    }

    return result
      .then(function (events) {
        return _.compact(_.map(events, validateAndParseEvent))
      })
  }

  this.deleteEvents = function (accountId, eventIds) {
    return storage.deleteEvents(accountId, eventIds)
      .then(function () {
        if (!accountId || !eventIds.length) {
          return
        }
        return Promise.all([
          aggregatesCache.acquireCache(accountId),
          this.ensureAggregationSecret(accountId)
        ])
          .then(bindCrypto(function (results) {
            var crypto = this
            var accountCache = results[0]
            var aggregationSecret = results[1]
            var decryptAggregate = crypto.decryptSymmetricWith(aggregationSecret)
            var encryptAggregate = crypto.encryptSymmetricWith(aggregationSecret)

            return Promise.all(_.chain(eventIds)
              .groupBy(function (eventId) {
                var time = ULID.decodeTime(eventId)
                return startOfHour(new Date(time)).toJSON()
              })
              .pairs()
              .map(function (pair) {
                var timestamp = pair[0]
                var eventIds = pair[1]

                var cachedItem = _.findWhere(accountCache, { timestamp: timestamp })
                return Promise.resolve(cachedItem || storage.getAggregate(accountId, timestamp)
                  .then(function (encryptedAggregate) {
                    if (!encryptedAggregate) {
                      return null
                    }
                    return decryptAggregate(encryptedAggregate.value)
                      .then(function (decryptedValue) {
                        return _.extend(encryptedAggregate, { value: decryptedValue })
                      })
                  }))
                  .then(function (aggregate) {
                    if (!aggregate) {
                      return {}
                    }
                    return removeFromAggregate(aggregate, 'eventId', eventIds)
                  })
                  .then(function (updatedAggregate) {
                    aggregatesCache.releaseCache(accountId, updatedAggregate)

                    if (!_.size(updatedAggregate)) {
                      storage.deleteAggregate(accountId, timestamp)
                    } else {
                      encryptAggregate(updatedAggregate).then(function (encryptedValue) {
                        storage.putAggregate(accountId, timestamp, encryptedValue)
                      })
                    }
                  })
              })
              .value())
          }))
      })
  }

  this.countEvents = function (accountId) {
    return storage.countEvents(accountId)
  }
}

function toUpperBound (date) {
  return ULID.ulid(date.getTime() + 1)
}

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
      acc[key] = _.times(currentLength, _.constant(undefined))
    })

    for (var key in event) {
      acc[key].push(event[key])
    }

    var missingKeys = _.difference(knownKeys, givenKeys)
    _.each(missingKeys, function (key) {
      acc[key].push(undefined)
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
      acc[key] = _.times(currentLength, _.constant(undefined))
    })

    for (var key in aggregate) {
      acc[key] = acc[key].concat(aggregate[key])
    }

    var missingKeys = _.difference(knownKeys, givenKeys)
    var aggregateLength = _.size(_.head(_.values(aggregate)))
    _.each(missingKeys, function (key) {
      acc[key] = acc[key].concat(_.times(aggregateLength, _.constant(undefined)))
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

function LockedCache () {
  var cache = {}
  var locks = []

  this.acquireCache = function (key) {
    cache[key] = cache[key] || []
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
    var lock = locks.pop()
    lock.resolve()
  }
}
