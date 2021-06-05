/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
var startOfHour = require('date-fns/startOfHour')
var startOfDay = require('date-fns/startOfDay')
var startOfWeek = require('date-fns/startOfWeek')
var startOfMonth = require('date-fns/startOfMonth')
var endOfHour = require('date-fns/endOfHour')
var endOfDay = require('date-fns/endOfDay')
var endOfWeek = require('date-fns/endOfWeek')
var endOfMonth = require('date-fns/endOfMonth')
var subMinutes = require('date-fns/subMinutes')
var subHours = require('date-fns/subHours')
var subDays = require('date-fns/subDays')
var subWeeks = require('date-fns/subWeeks')
var subMonths = require('date-fns/subMonths')
var diffHours = require('date-fns/differenceInHours')
var diffDays = require('date-fns/differenceInDays')
var diffWeeks = require('date-fns/differenceInWeeks')
var diffMonths = require('date-fns/differenceInMonths')
var startOfYesterday = require('date-fns/startOfYesterday')
var endOfYesterday = require('date-fns/endOfYesterday')

var stats = require('./stats')
var filters = require('./filters')
var storage = require('./aggregating-storage')
var placeInBucket = require('./buckets')
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

var difference = {
  hours: diffHours,
  days: diffDays,
  weeks: diffWeeks,
  months: diffMonths
}

module.exports = new Queries(storage)
module.exports.Queries = Queries

function Queries (storage) {
  this.getDefaultStats = function (accountId, query, publicJwk, privateJwk) {
    if (accountId && !privateJwk) {
      return Promise.reject(
        new Error('Got account id but no private key, cannot continue.')
      )
    }

    var filter = new filters.Noop()
    if (query && query.filter) {
      var tuple = query.filter.split(':')
      var prop = tuple.shift()
        .split('')
        .map(function (c, i) { return i ? c : c.toUpperCase() })
        .join('')
      var value = tuple.join(':')
      if (prop && filters[prop] && value) {
        filter = new filters[prop](value)
      }
    }

    // resolution is the unit to group by when looking back
    var resolution = (query && query.resolution) || 'days'
    if (['hours', 'days', 'weeks', 'months'].indexOf(resolution) < 0) {
      return Promise.reject(new Error('Unknown resolution value: ' + resolution))
    }

    var fromParam
    var toParam
    try {
      fromParam = query && query.from && startOf[resolution](new Date(query.from))
      toParam = query && query.to && endOf[resolution](new Date(query.to))
    } catch (err) {
      return Promise.reject(new Error('Error parsing given date ranges: ' + err.message))
    }

    if ((fromParam && !toParam) || (toParam && !fromParam)) {
      return Promise.reject(new Error(
        'Received either `from` or `to` parameter only. Both are required for querying a date range.'
      ))
    }

    // range is the number of units the query looks back from the given
    // start day
    var range = query && query.range
    if (range !== 'yesterday') {
      range = parseInt(range || 7, 10)
    }
    if (fromParam) {
      range = Math.abs(difference[resolution](toParam, fromParam)) + 1
    }
    if (range === 'yesterday') {
      fromParam = startOfYesterday()
      toParam = endOfYesterday()
      range = Math.abs(difference[resolution](toParam, fromParam)) + 1
    }

    var now = (query && query.now && new Date(query.now)) || new Date()
    var lowerBound = fromParam || startOf[resolution](subtract[resolution](now, range - 1))
    var upperBound = toParam || endOf[resolution](now)

    var proxy = new GetEventsProxy(storage, accountId, publicJwk, privateJwk)
    var allEvents = storage.getRawEvents(accountId)

    var eventsInBounds = proxy.getEvents(lowerBound, upperBound)
      .then(filter.apply.bind(filter))

    var realtimeLowerBound = subMinutes(now, 15)
    var realtimeUpperBound = now
    var realtimeEvents = proxy.getEvents(realtimeLowerBound, realtimeUpperBound)

    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    var pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        var date = subtract[resolution](toParam || now, distance)

        var lowerBound = startOf[resolution](date)
        var upperBound = endOf[resolution](date)
        var eventsInBounds = proxy.getEvents(lowerBound, upperBound)
          .then(filter.scopedFilter.bind(filter))

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
      var chunk = proxy.getEvents(currentChunkLowerBound, currentChunkUpperBound)
      retentionChunks.push(chunk)
    }
    retentionChunks = retentionChunks.reverse()
    var retentionMatrix = Promise.all(retentionChunks)
      .then(function (chunks) {
        return stats.retention.apply(stats, chunks)
      })

    var uniqueSessions = stats.uniqueSessions(eventsInBounds)
    var bounceRate = stats.bounceRate(eventsInBounds)
    var referrers = stats.referrers(eventsInBounds)
    var pages = stats.pages(eventsInBounds)
    var campaigns = stats.campaigns(eventsInBounds)
    var sources = stats.sources(eventsInBounds)
    var avgPageload = stats.avgPageload(eventsInBounds)
    var avgPageDepth = stats.avgPageDepth(eventsInBounds)
    var landingPages = stats.landingPages(eventsInBounds)
    var exitPages = stats.exitPages(eventsInBounds)
    var mobileShare = stats.mobileShare(eventsInBounds)

    var livePages = stats.activePages(realtimeEvents)
    var liveUsers = stats.visitors(realtimeEvents)

    var onboardingStats = accountId
      ? null
      : stats.onboardingStats(allEvents.then(function (result) {
        return _.map(result, validateAndParseEvent)
      }))

    proxy.call()

    return Promise
      .all([
        uniqueUsers,
        uniqueAccounts,
        uniqueSessions,
        referrers,
        pages,
        pageviews,
        bounceRate,
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
        returningUsers,
        onboardingStats
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
          avgPageload: results[7],
          avgPageDepth: results[8],
          landingPages: results[9],
          exitPages: results[10],
          mobileShare: results[11],
          livePages: results[12],
          liveUsers: results[13],
          campaigns: results[14],
          sources: results[15],
          retentionMatrix: results[16],
          empty: results[17],
          returningUsers: results[18],
          onboardingStats: results[19],
          resolution: resolution,
          range: range,
          filter: (query && query.filter) || null
        }
      })
      .then(postProcessResult(query && query.resolution, range))
  }
}

function postProcessResult (resolution, range) {
  return function (result) {
    if (resolution === 'months' && range === 6) {
      result.returningUsers = null
    }
    return result
  }
}

function GetEventsProxy (storage, accountId, publicJwk, privateJwk) {
  var calls = []
  this.getEvents = function (lowerBound, upperBound) {
    return new Promise(function (resolve) {
      calls.push({
        lowerBound: lowerBound,
        upperBound: upperBound,
        resolve: resolve
      })
    })
  }

  this.call = function () {
    var maxUpperBound = _.last(_.sortBy(_.pluck(calls, 'upperBound'), _.identity))
    var minLowerBound = _.head(_.sortBy(_.pluck(calls, 'lowerBound'), _.identity))
    var allEvents = storage.getEvents({
      accountId: accountId,
      privateJwk: privateJwk,
      publicJwk: publicJwk
    }, minLowerBound, maxUpperBound)
      .then(function (events) {
        return _.chain(events)
          .map(validateAndParseEvent)
          .compact()
          .sortBy('eventId')
          .value()
      })
    _.each(calls, function (call) {
      call.resolve(allEvents.then(function (events) {
        var upperBoundAsId = call.upperBound && storage.toUpperBound(call.upperBound)
        var lowerBoundAsId = call.lowerBound && storage.toLowerBound(call.lowerBound)
        return _.filter(events, function (event) {
          return lowerBoundAsId <= event.eventId && event.eventId <= upperBoundAsId
        })
      }))
    })
  }
}

module.exports.validateAndParseEvent = validateAndParseEvent
function validateAndParseEvent (event) {
  if (!eventSchema(event) || !payloadSchema(event.payload)) {
    return null
  }
  var clone = JSON.parse(JSON.stringify(event))

  ;['href', 'rawHref', 'referrer'].forEach(function (key) {
    clone.payload[key] = clone.payload[key] && normalizeURL(clone.payload[key])
  })

  Object.assign(clone.payload, {
    $referrer: clone.payload.referrer && clone.payload.referrer.host !== clone.payload.href.host
      ? placeInBucket(clone.payload.referrer.host)
      : null
  })

  return clone
}

var normalizeURL = _.memoize(_normalizeURL)
function _normalizeURL (urlString) {
  var url = new window.URL(urlString)
  if (!/\/$/.test(url.pathname)) {
    url.pathname += '/'
  }
  return url
}
