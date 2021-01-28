/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('underscore')
const startOfHour = require('date-fns/start_of_hour')
const startOfDay = require('date-fns/start_of_day')
const startOfWeek = require('date-fns/start_of_week')
const startOfMonth = require('date-fns/start_of_month')
const endOfHour = require('date-fns/end_of_hour')
const endOfDay = require('date-fns/end_of_day')
const endOfWeek = require('date-fns/end_of_week')
const endOfMonth = require('date-fns/end_of_month')
const subMinutes = require('date-fns/sub_minutes')
const subHours = require('date-fns/sub_hours')
const subDays = require('date-fns/sub_days')
const subWeeks = require('date-fns/sub_weeks')
const subMonths = require('date-fns/sub_months')
const diffHours = require('date-fns/difference_in_hours')
const diffDays = require('date-fns/difference_in_days')
const diffWeeks = require('date-fns/difference_in_weeks')
const diffMonths = require('date-fns/difference_in_months')
const startOfYesterday = require('date-fns/start_of_yesterday')
const endOfYesterday = require('date-fns/end_of_yesterday')

const stats = require('./stats')
const storage = require('./aggregating-storage')
const eventSchema = require('./event.schema')
const payloadSchema = require('./payload.schema')

const startOf = {
  hours: startOfHour,
  days: startOfDay,
  weeks: function (date) {
    return startOfWeek(date, { weekStartsOn: 1 })
  },
  months: startOfMonth
}

const endOf = {
  hours: endOfHour,
  days: endOfDay,
  weeks: function (date) {
    return endOfWeek(date, { weekStartsOn: 1 })
  },
  months: endOfMonth
}

const subtract = {
  hours: subHours,
  days: subDays,
  weeks: subWeeks,
  months: subMonths
}

const difference = {
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

    // resolution is the unit to group by when looking back
    const resolution = (query && query.resolution) || 'days'
    if (['hours', 'days', 'weeks', 'months'].indexOf(resolution) < 0) {
      return Promise.reject(new Error('Unknown resolution value: ' + resolution))
    }

    let fromParam
    let toParam
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
    let range = query && query.range
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

    const now = (query && query.now && new Date(query.now)) || new Date()
    const lowerBound = fromParam || startOf[resolution](subtract[resolution](now, range - 1))
    const upperBound = toParam || endOf[resolution](now)

    const proxy = new GetEventsProxy(storage, accountId, publicJwk, privateJwk)
    const allEvents = storage.getRawEvents(accountId)
    const eventsInBounds = proxy.getEvents(lowerBound, upperBound)
    const realtimeLowerBound = subMinutes(now, 15)
    const realtimeUpperBound = now
    const realtimeEvents = proxy.getEvents(realtimeLowerBound, realtimeUpperBound)
    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    const pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        const date = subtract[resolution](toParam || now, distance)

        const lowerBound = startOf[resolution](date)
        const upperBound = endOf[resolution](date)
        const eventsInBounds = proxy.getEvents(lowerBound, upperBound)

        const pageviews = stats.pageviews(eventsInBounds)
        const visitors = stats.visitors(eventsInBounds)
        const accounts = stats.accounts(eventsInBounds)

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

    const uniqueUsers = stats.visitors(eventsInBounds)
    const uniqueAccounts = stats.accounts(eventsInBounds)
    const returningUsers = stats.returningUsers(eventsInBounds, allEvents)

    const empty = storage.countEvents(accountId).then(function (count) {
      return count === 0
    })

    let retentionChunks = []
    for (let i = 0; i < 4; i++) {
      const currentChunkLowerBound = subtract.days(now, (i + 1) * 7)
      const currentChunkUpperBound = subtract.days(now, i * 7)
      const chunk = proxy.getEvents(currentChunkLowerBound, currentChunkUpperBound)
      retentionChunks.push(chunk)
    }
    retentionChunks = retentionChunks.reverse()
    const retentionMatrix = Promise.all(retentionChunks)
      .then(function (chunks) {
        return stats.retention.apply(stats, chunks)
      })

    const uniqueSessions = stats.uniqueSessions(eventsInBounds)
    const bounceRate = stats.bounceRate(eventsInBounds)
    const referrers = stats.referrers(eventsInBounds)
    const pages = stats.pages(eventsInBounds)
    const campaigns = stats.campaigns(eventsInBounds)
    const sources = stats.sources(eventsInBounds)
    const avgPageload = stats.avgPageload(eventsInBounds)
    const avgPageDepth = stats.avgPageDepth(eventsInBounds)
    const landingPages = stats.landingPages(eventsInBounds)
    const exitPages = stats.exitPages(eventsInBounds)
    const mobileShare = stats.mobileShare(eventsInBounds)

    const livePages = stats.activePages(realtimeEvents)
    const liveUsers = stats.visitors(realtimeEvents)

    const onboardingStats = accountId
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
          range: range
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
  const calls = []
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
    const maxUpperBound = _.last(_.sortBy(_.pluck(calls, 'upperBound'), _.identity))
    const minLowerBound = _.head(_.sortBy(_.pluck(calls, 'lowerBound'), _.identity))
    const allEvents = storage.getEvents({
      accountId: accountId,
      privateJwk: privateJwk,
      publicJwk: publicJwk
    }, minLowerBound, maxUpperBound)
      .then(function (events) {
        return _.compact(_.map(events, validateAndParseEvent))
      })
    _.each(calls, function (call) {
      call.resolve(allEvents.then(function (events) {
        const upperBoundAsId = call.upperBound && storage.toUpperBound(call.upperBound)
        const lowerBoundAsId = call.lowerBound && storage.toLowerBound(call.lowerBound)
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
  const clone = JSON.parse(JSON.stringify(event))

  ;['href', 'rawHref', 'referrer'].forEach(function (key) {
    clone.payload[key] = clone.payload[key] && normalizeURL(clone.payload[key])
  })

  return clone
}

const normalizeURL = _.memoize(_normalizeURL)
function _normalizeURL (urlString) {
  const url = new window.URL(urlString)
  if (!/\/$/.test(url.pathname)) {
    url.pathname += '/'
  }
  return url
}
