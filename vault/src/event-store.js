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
  this.ensureAggregationSecret = bindCrypto(function (accountId, publicKey, privateJwk) {
    var crypto = this
    aggregationSecrets[accountId] = aggregationSecrets[accountId] || storage.getAggregationSecret(accountId)
      .then(function (secret) {
        if (secret) {
          return crypto.decrypAsymmetricWith(privateJwk)(secret)
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
      })
  })

  this.putEvents = function (accountId, events, privateJwk) {
    return storage.putEvents(accountId, events)
      .then(function () {
        if (!accountId) {
          return
        }
        return storage.getEncryptedSecrets(accountId)
          .then(function (encryptedSecrets) {
            return decryptEvents(events, encryptedSecrets, privateJwk)
          })
          .then(function (events) {
            return Promise.all(_.chain(events)
              .groupBy(function (event) {
                var time = ULID.decodeTime(event.eventId)
                return startOfHour(new Date(time)).toJSON()
              })
              .pairs()
              .map(function (pair) {
                var timestamp = pair[0]
                var events = pair[1]
                return storage.getAggregate(accountId, timestamp)
                  .then(function (existingAggregate) {
                    var aggregated = aggregate(events, normalizeEvent)
                    if (existingAggregate) {
                      aggregated = mergeAggregates([existingAggregate, aggregated])
                    }
                    return storage.putAggregate(accountId, timestamp, aggregated)
                  })
              })
              .value())
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
      result = storage.getAggregates(
        accountId,
        lowerBound && startOfHour(lowerBound).toJSON(),
        upperBound && endOfHour(upperBound).toJSON()
      )
        .then(function (aggregates) {
          return inflateAggregate(mergeAggregates(aggregates), denormalizeEvent)
        })
        .then(function (events) {
          return events.filter(function (event) {
            return lowerBoundAsId <= event.eventId && event.eventId <= upperBoundAsId
          })
        })
    }
    return result.then(function (events) {
      return _.compact(_.map(events, validateAndParseEvent))
    })
  }

  this.deleteEvents = function (accountId, eventIds) {
    return storage.deleteEvents(accountId, eventIds)
      .then(function () {
        if (!accountId || !eventIds.length) {
          return
        }
        Promise.all(_.chain(eventIds)
          .groupBy(function (eventId) {
            var time = ULID.decodeTime(eventId)
            return startOfHour(new Date(time)).toJSON()
          })
          .pairs()
          .map(function (pair) {
            var timestamp = pair[0]
            var eventIds = pair[1]
            return storage.getAggregate(accountId, timestamp)
              .then(function (aggregate) {
                if (!aggregate) {
                  return {}
                }
                return removeFromAggregate(aggregate, 'eventId', eventIds)
              })
              .then(function (updatedAggregate) {
                if (!_.size(updatedAggregate)) {
                  return storage.deleteAggregate(accountId, timestamp)
                }
                return storage.putAggregate(accountId, timestamp, updatedAggregate)
              })
          })
          .value())
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
