/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
var ULID = require('ulid')
var startOfHour = require('date-fns/start_of_hour')
var startOfDay = require('date-fns/start_of_day')
var startOfWeek = require('date-fns/start_of_week')
var startOfMonth = require('date-fns/start_of_month')
var endOfHour = require('date-fns/end_of_hour')
var endOfDay = require('date-fns/end_of_day')
var endOfWeek = require('date-fns/end_of_week')
var endOfMonth = require('date-fns/end_of_month')
var subMinutes = require('date-fns/sub_minutes')
var subHours = require('date-fns/sub_hours')
var subDays = require('date-fns/sub_days')
var subWeeks = require('date-fns/sub_weeks')
var subMonths = require('date-fns/sub_months')

var stats = require('./stats')
var storage = require('./storage')
var eventSchema = require('./event.schema')
var payloadSchema = require('./payload.schema')

var startOf = {
  hours: startOfHour,
  days: startOfDay,
  weeks: function (date) {
    return startOfWeek(date, { weekStartsOn: 1 })
  },
  months: startOfMonth
}

var endOf = {
  hours: endOfHour,
  days: endOfDay,
  weeks: function (date) {
    return endOfWeek(date, { weekStartsOn: 1 })
  },
  months: endOfMonth
}

var subtract = {
  hours: subHours,
  days: subDays,
  weeks: subWeeks,
  months: subMonths
}

module.exports = new Queries(storage)
module.exports.Queries = Queries

function Queries (storage) {
  function getAllEvents (accountId, lowerBound, upperBound) {
    if (!accountId) {
      return storage.getAllEvents(accountId, toLowerBound(lowerBound), toUpperBound(upperBound))
        .then(function (events) {
          return _.compact(events.map(validateAndParseEvent))
        })
    }

    return storage.getAggregates(
      accountId,
      lowerBound && startOfHour(lowerBound).toJSON(),
      upperBound && endOfHour(upperBound).toJSON()
    )
      .then(function (aggregates) {
        var events = inflateAggregate(mergeAggregates(aggregates), denormalizeEvent)
        return _.compact(events.map(validateAndParseEvent))
      })
  }

  this.getDefaultStats = function (accountId, query, privateJwk) {
    if (accountId && !privateJwk) {
      return Promise.reject(
        new Error('Got account id but no private key, cannot continue.')
      )
    }

    // range is the number of units the query looks back from the given
    // start day
    var range = (query && query.range) || 7
    // resolution is the unit to group by when looking back
    var resolution = (query && query.resolution) || 'days'
    if (['hours', 'days', 'weeks', 'months'].indexOf(resolution) < 0) {
      return Promise.reject(new Error('Unknown resolution value: ' + resolution))
    }

    var now = (query && query.now && new Date(query.now)) || new Date()
    var lowerBound = startOf[resolution](subtract[resolution](now, range - 1))
    var upperBound = endOf[resolution](now)

    var allEvents = getAllEvents(accountId)
    var eventsInBounds = getAllEvents(accountId, lowerBound, upperBound)
    var realtimeLowerBound = subMinutes(now, 15)
    var realtimeUpperBound = now
    var realtimeEvents = getAllEvents(accountId, realtimeLowerBound, realtimeUpperBound)
    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    var pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        var date = subtract[resolution](now, distance)

        var lowerBound = startOf[resolution](date)
        var upperBound = endOf[resolution](date)
        var eventsInBounds = getAllEvents(accountId, lowerBound, upperBound)

        var pageviews = stats.pageviews(eventsInBounds)
        var visitors = stats.visitors(eventsInBounds)
        var accounts = stats.accounts(eventsInBounds)

        return Promise.all([pageviews, visitors, accounts])
          .then(function (values) {
            return {
              date: date.toJSON(),
              pageviews: values[0],
              visitors: values[1],
              accounts: values[2]
            }
          })
      }))
      .then(function (days) {
        return _.sortBy(days, 'date')
      })

    var uniqueUsers = stats.visitors(eventsInBounds)
    var uniqueAccounts = stats.accounts(eventsInBounds)
    var returningUsers = stats.returningUsers(eventsInBounds, allEvents)

    var empty = storage.countEvents(accountId).then(function (count) {
      return count === 0
    })

    var retentionChunks = []
    for (var i = 0; i < 4; i++) {
      var currentChunkLowerBound = subtract.days(now, (i + 1) * 7)
      var currentChunkUpperBound = subtract.days(now, i * 7)
      var chunk = getAllEvents(accountId, currentChunkLowerBound, currentChunkUpperBound)
      retentionChunks.push(chunk)
    }
    retentionChunks = retentionChunks.reverse()
    var retentionMatrix = Promise.all(retentionChunks)
      .then(function (chunks) {
        return stats.retention.apply(stats, chunks)
      })

    var decryptedEvents = eventsInBounds
    var realtime = realtimeEvents
    var loss = stats.loss(decryptedEvents)
    var uniqueSessions = stats.uniqueSessions(decryptedEvents)
    var bounceRate = stats.bounceRate(decryptedEvents)
    var referrers = stats.referrers(decryptedEvents)
    var pages = stats.pages(decryptedEvents)
    var campaigns = stats.campaigns(decryptedEvents)
    var sources = stats.sources(decryptedEvents)
    var avgPageload = stats.avgPageload(decryptedEvents)
    var avgPageDepth = stats.avgPageDepth(decryptedEvents)
    var landingPages = stats.landingPages(decryptedEvents)
    var exitPages = stats.exitPages(decryptedEvents)
    var mobileShare = stats.mobileShare(decryptedEvents)

    var livePages = stats.activePages(realtime)
    var liveUsers = stats.visitors(realtime)

    return Promise
      .all([
        uniqueUsers,
        uniqueAccounts,
        uniqueSessions,
        referrers,
        pages,
        pageviews,
        bounceRate,
        loss,
        avgPageload,
        avgPageDepth,
        landingPages,
        exitPages,
        mobileShare,
        livePages,
        liveUsers,
        campaigns,
        sources,
        retentionMatrix,
        empty,
        returningUsers
      ])
      .then(function (results) {
        return {
          uniqueUsers: results[0],
          uniqueAccounts: results[1],
          uniqueSessions: results[2],
          referrers: results[3],
          pages: results[4],
          pageviews: results[5],
          bounceRate: results[6],
          loss: results[7],
          avgPageload: results[8],
          avgPageDepth: results[9],
          landingPages: results[10],
          exitPages: results[11],
          mobileShare: results[12],
          livePages: results[13],
          liveUsers: results[14],
          campaigns: results[15],
          sources: results[16],
          retentionMatrix: results[17],
          empty: results[18],
          returningUsers: results[19],
          resolution: resolution,
          range: range
        }
      })
  }
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
