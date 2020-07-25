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

var decryptEvents = require('./decrypt-events')
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
  function getAllEvents () {
    return storage.getAllEvents
      .apply(storage, arguments)
      .then(function (events) {
        return events.filter(eventSchema)
      })
  }

  this.getDefaultStats = function (accountId, query, privateJwk) {
    if (!accountId && accountId !== null) {
      return Promise.reject(
        new Error('Expected either an account id or null to be given, got: ' + accountId)
      )
    }

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

    var now = (query && query.now) || new Date()
    var lowerBound = toLowerBound(startOf[resolution](subtract[resolution](now, range - 1)))
    var upperBound = toUpperBound(endOf[resolution](now))

    var allEvents = getAllEvents(accountId)
    var eventsInBounds = getAllEvents(accountId, lowerBound, upperBound)
    var realtimeLowerBound = toLowerBound(subMinutes(now, 15))
    var realtimeUpperBound = toUpperBound(now)
    var realtimeEvents = getAllEvents(accountId, realtimeLowerBound, realtimeUpperBound)
    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    var pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        var date = subtract[resolution](now, distance)

        var lowerBound = toLowerBound(startOf[resolution](date))
        var upperBound = toUpperBound(endOf[resolution](date))
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
      var currentChunkLowerBound = toLowerBound(subtract.days(now, (i + 1) * 7))
      var currentChunkUpperBound = toUpperBound(subtract.days(now, i * 7))
      var chunk = getAllEvents(accountId, currentChunkLowerBound, currentChunkUpperBound)
      retentionChunks.push(chunk)
    }
    retentionChunks = retentionChunks.reverse()
    var retentionMatrix = Promise.all(retentionChunks)
      .then(function (chunks) {
        return stats.retention.apply(stats, chunks)
      })

    // There are two types of queries happening here: those that rely solely
    // on the IndexedDB indices, and those that require the event payload
    // (which might be encrypted and therefore not indexable).
    // Theoretically *all* queries could be done on the set of events after
    // encryption, yet it seems using the IndexedDB API where possible makes
    // more sense and performs better.
    var decryptions = [eventsInBounds, realtimeEvents]
      .map(function (asyncSet) {
        return asyncSet
          .then(function (set) {
            return accountId && privateJwk
              ? doDecrypt(set, accountId, privateJwk)
              : set
          })
          .then(function (events) {
            return _.compact(events.map(validateAndParseEvent))
          })
      })

    var decryptedEvents = decryptions[0]
    var realtime = decryptions[1]
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

  function doDecrypt (events, accountId, privateJwk) {
    return storage.getEncryptedSecrets(accountId)
      .then(function (secrets) {
        return decryptEvents(events, secrets, privateJwk)
      })
  }
}

module.exports.validateAndParseEvent = validateAndParseEvent
function validateAndParseEvent (event) {
  if (!payloadSchema(event.payload)) {
    return null
  }
  var clone = JSON.parse(JSON.stringify(event))
  if (clone.payload.href) {
    clone.payload.href = new window.URL(clone.payload.href)
  }
  if (clone.payload.referrer) {
    clone.payload.referrer = new window.URL(clone.payload.referrer)
  }
  return clone
}

function toUpperBound (date) {
  return ULID.ulid(date.getTime() + 1)
}

function toLowerBound (date) {
  return ULID.ulid(date.getTime() - 1)
}
