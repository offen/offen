/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
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
var storage = require('./aggregating-storage')

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

    var proxy = new GetEventsProxy(storage, accountId, privateJwk)

    var allEvents = storage.getRawEvents(accountId)
    var eventsInBounds = proxy.getEvents(lowerBound, upperBound)
    var realtimeLowerBound = subMinutes(now, 15)
    var realtimeUpperBound = now
    var realtimeEvents = proxy.getEvents(realtimeLowerBound, realtimeUpperBound)
    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    var pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        var date = subtract[resolution](now, distance)

        var lowerBound = startOf[resolution](date)
        var upperBound = endOf[resolution](date)
        var eventsInBounds = proxy.getEvents(lowerBound, upperBound)

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

    var loss = stats.loss(eventsInBounds)
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

function GetEventsProxy (storage, accountId, privateJwk) {
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
      privateJwk: privateJwk
    }, minLowerBound, maxUpperBound)
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
