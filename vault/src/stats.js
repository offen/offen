/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

// All functions in this module are written with the expectation of given
// events conforming to the schemas defined in event.schema and payload.schema,
// meaning there is no need to perform safety checks for the existence of props
// which are already guaranteed by an event conforming to the schema. This
// matters as these functions can process a lot of events in certain cases
// so any check can have a real world performance impact.

var _ = require('underscore')

var propertyAccessors = {
  sessionId: _.property(['payload', 'sessionId']),
  href: _.property(['payload', 'href']),
  timestamp: _.property(['payload', 'timestamp']),
  pageload: _.property(['payload', 'pageload']),
  isMobile: _.property(['payload', 'isMobile']),
  computedReferrer: _.property(['payload', '$referrer']),
  eventId: _.property('eventId'),
  geo: _.property(['payload', 'geo'])
}

// The bounce rate is calculated as the percentage of session identifiers
// in the set of events that are associated with one event only, i.e. there
// has been no follow-up event.
exports.bounceRate = consumeAsync(bounceRate)

function bounceRate (events) {
  var sessionCounts = 0
  var bounces = _.chain(events)
    .map(propertyAccessors.sessionId)
    .compact()
    .countBy(_.identity)
    .values()
    .tap(function (sessions) {
      sessionCounts = sessions.length
    })
    .filter(function (pagesInSession) {
      return pagesInSession === 1
    })
    .size()
    .value()

  if (sessionCounts === 0) {
    return 0
  }

  // The bounce rate is the percentage of sessions where there is only
  // one event with the respective identifier in the given se
  return bounces / sessionCounts
}

// `referrers` is the list of referrer values, grouped by host name. Common
// referrers (i.e. search engines or apps) will replaced with a human-friendly
// name assigned to their bucket.
exports.referrers = consumeAsync(referrers)

function referrers (events) {
  var countsBySession = _.countBy(events, propertyAccessors.sessionId)
  var split = _.chain(events)
    .groupBy(propertyAccessors.sessionId)
    .values()
    .map(_.head)
    .partition(propertyAccessors.computedReferrer)
    .value()

  var foreignEvents = split[0]
  var noneEvents = split[1]

  return _.chain(foreignEvents)
    .map(propertyAccessors.computedReferrer)
    .zip(_.map(foreignEvents, propertyAccessors.sessionId))
    .filter(_.head)
    .groupBy(_.head)
    .pairs()
    .map(function (pair) {
      var sessions = _.chain(pair[1])
        .map(function (pair) {
          return _.last(pair)
        })
        .uniq()
        .value()
      var numSessions = _.size(sessions)
      var associatedViews = _.reduce(sessions, function (acc, sessionId) {
        return acc + countsBySession[sessionId]
      }, 0)
      return {
        key: pair[0],
        count: [
          numSessions,
          associatedViews / numSessions
        ]
      }
    })
    .tap(function (rows) {
      if (!noneEvents.length) {
        return
      }
      var noneViewCount = _.chain(noneEvents)
        .reduce(function (acc, event) {
          var sessionId = event.payload.sessionId
          return acc + countsBySession[sessionId]
        }, 0)
        .value()
      rows.push({
        key: '__NONE_REFERRER__',
        count: [noneEvents.length, noneViewCount / noneEvents.length]
      })
    })
    .sortBy(function (row) { return row.count[0] })
    .reverse()
    .value()
}

// `campaigns` groups the referrer values by their `utm_campaign` if present
exports.campaigns = consumeAsync(_queryParam('utm_campaign'))

function _queryParam (key) {
  return function (events) {
    var countsBySession = _.countBy(events, propertyAccessors.sessionId)

    return _.chain(events)
      .groupBy(propertyAccessors.sessionId)
      .pairs()
      .map(function (pair) {
        var firstMatch = _.find(pair[1], function (event) {
          return event.payload.rawHref
            ? event.payload.rawHref.searchParams.get(key)
            : event.payload.href.searchParams.get(key)
        })
        if (!firstMatch) {
          return null
        }
        return {
          sessionId: firstMatch.payload.sessionId,
          value: firstMatch.payload.rawHref
            ? firstMatch.payload.rawHref.searchParams.get(key)
            : firstMatch.payload.href.searchParams.get(key)
        }
      })
      .compact()
      .groupBy('value')
      .pairs()
      .map(function (pair) {
        var value = pair[0]
        var items = pair[1]
        var associatedViews = _.chain(items)
          .pluck('sessionId')
          .uniq()
          .reduce(function (acc, sessionId) {
            return acc + countsBySession[sessionId]
          }, 0)
          .value()

        return {
          key: value,
          count: [
            items.length,
            associatedViews / items.length
          ]
        }
      })
      .sortBy(function (row) { return row.count[0] })
      .reverse()
      .value()
  }
}

// `sources` groups the referrer values by their `utm_source` if present
exports.sources = consumeAsync(_queryParam('utm_source'))

// `pages` contains all pages visited sorted by the number of pageviews.
// URLs are stripped off potential query strings and hash parameters
// before grouping.
exports.pages = consumeAsync(pages)

function pages (events) {
  return _pages(events, false)
}

// `activePages` contains the pages last visited by each user in the given set
// of events and is sorted by the number of pageviews.
// URLs are stripped off potential query strings and hash parameters
// before grouping.
exports.activePages = consumeAsync(activePages)

function activePages (events) {
  return _pages(events, true)
}

function _pages (events, perUser) {
  var result = _.chain(events)
    .filter(propertyAccessors.href)

  if (perUser) {
    // in this branch, only the most recent event for each user
    // will be considered
    result = result
      .groupBy('secretId')
      .pairs()
      .map(function (pair) {
        return _.last(
          _.sortBy(pair[1], propertyAccessors.timestamp)
        )
      })
      .flatten(true)
  }

  return result
    .map(function (event) {
      var strippedHref = event.payload.href.origin + event.payload.href.pathname
      return { accountId: event.accountId, href: strippedHref }
    })
    .groupBy('accountId')
    .values()
    .map(function (pageviewsPerAccount) {
      return _.chain(pageviewsPerAccount)
        .countBy('href')
        .pairs()
        .map(pairToRow)
        .value()
    })
    .flatten(true)
    .sortBy('key')
    .reverse()
    .sortBy('count')
    .reverse()
    .value()
}

// `avgPageload` calculates the average pageload time of the given
// set of events
exports.avgPageload = consumeAsync(avgPageload)

function avgPageload (events) {
  var count
  var total = _.chain(events)
    .map(propertyAccessors.pageload)
    .filter(function (value) { return value && value > 0 })
    .tap(function (entries) {
      count = entries.length
    })
    .reduce(function (acc, next) {
      return acc + next
    }, 0)
    .value()

  if (count === 0) {
    return null
  }

  return total / count
}

// `avgPageDepth` calculates the average session length in the given
// set of events
exports.avgPageDepth = consumeAsync(avgPageDepth)

function avgPageDepth (events) {
  var views = countKeys(['payload', 'sessionId'], false)(events)
  var uniqueSessions = countKeys(['payload', 'sessionId'], true)(events)
  if (uniqueSessions === 0) {
    return null
  }
  return views / uniqueSessions
}

exports.exitPages = consumeAsync(exitPages)

// `exitPages` groups the given events by session identifier and then
// returns a sorted list of exit pages for these sessions. URLs will be
// stripped off query and hash parameters. Sessions that only contain
// a single page will be excluded.
function exitPages (events) {
  return _.chain(events)
    .filter(function (event) {
      return event.payload.sessionId && event.payload.href
    })
    .groupBy(propertyAccessors.sessionId)
    .filter(function (el) {
      return el.length >= 2
    })
    .map(function (events, key) {
      // for each session, we are only interested in the first
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .last()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(pairToRow)
    .sortBy('key')
    .reverse()
    .sortBy('count')
    .reverse()
    .value()
}

// `landingPages` groups the given events by session identifier and then
// returns a sorted list of landing pages for these sessions. URLs will be
// stripped off query and hash parameters.
exports.landingPages = consumeAsync(landingPages)

function landingPages (events) {
  return _.chain(events)
    .filter(function (e) {
      return e.payload.sessionId && e.payload.href
    })
    .groupBy(propertyAccessors.sessionId)
    .map(function (events, key) {
      // for each session, we are only interested in the earliest
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .first()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(pairToRow)
    .sortBy('key')
    .reverse()
    .sortBy('count')
    .reverse()
    .value()
}

// `mobileShare` returns the percentage of events flagged as mobile
// in the given set of events.
exports.mobileShare = consumeAsync(mobileShare)

function mobileShare (events) {
  var allEvents = events.length
  var mobileEvents = _.chain(events)
    .filter(propertyAccessors.isMobile)
    .size()
    .value()

  if (allEvents === 0) {
    return null
  }
  return mobileEvents / allEvents
}

// `geoLocation` counts sessions by geolocation
exports.geoLocation = consumeAsync(geoLocation)

function geoLocation (events) {
  var eventsBySession = _.countBy(events, propertyAccessors.sessionId)
  return _.chain(events)
    .groupBy(propertyAccessors.sessionId)
    .values()
    .map(function (session) {
      return _.find(session, propertyAccessors.geo) || session[0]
    })
    .groupBy(function (event) {
      var value = propertyAccessors.geo(event)
      if (value) {
        return value
      }
      return '__NONE_GEOLOCATION__'
    })
    .map(function (values, key) {
      var matchingSessions = values.length
      var matchingEvents = _.reduce(values, function (count, next) {
        return count + eventsBySession[propertyAccessors.sessionId(next)]
      }, 0)
      return {
        key: key,
        count: [
          matchingSessions,
          matchingEvents / matchingSessions
        ]
      }
    })
    .sortBy(function (item) {
      return item.count[0]
    })
    .reverse()
    .value()
}

// `retention` calculates a retention matrix for the given slices of events.
// The function itself does not make any assumptions about how these chunks are
// distributed in time.
exports.retention = consumeAsync(retention)

function retention (/* ...events */) {
  var chunks = [].slice.call(arguments)
  var result = []
  while (chunks.length) {
    var head = chunks.shift()
    var referenceIds = _.chain(head).pluck('secretId').uniq().value()
    var innerResult = chunks.reduce(function (acc, next) {
      var share
      if (referenceIds.length === 0) {
        share = 0
      } else {
        var matching = _.chain(next)
          .pluck('secretId').uniq()
          .intersection(referenceIds).size().value()
        share = matching / referenceIds.length
      }
      acc.push(share)
      return acc
    }, [referenceIds.length ? 1 : 0])
    result.push(innerResult)
  }
  return result
}

// `returningUsers` calculates the percentage of returning visitors in the given
// range as compared to the list of all known events
exports.returningUsers = consumeAsync(returningUsers)

function returningUsers (events, allEvents) {
  var oldestEventIdInRange = _.chain(events)
    .pluck('eventId')
    .sortBy()
    .head()
    .value()

  var usersBeforeRange = _.chain(allEvents)
    .filter(function (event) {
      return event.eventId < oldestEventIdInRange
    })
    .reduce(function (acc, next) {
      acc[next.secretId] = true
      return acc
    }, {})
    .value()

  var usersInRange = _.chain(events)
    .pluck('secretId')
    .uniq()
    .value()

  if (usersInRange.length === 0) {
    return 0
  }

  var newUsers = _.chain(usersInRange)
    .filter(function (secretId) {
      return !usersBeforeRange[secretId]
    })
    .value()

  return 1 - (newUsers.length / usersInRange.length)
}

exports.pageviews = consumeAsync(countKeys('secretId', false))
// `visitors` is the number of unique users for the given
//  set of events.
exports.visitors = consumeAsync(countKeys('secretId', true))
// This is the number of unique accounts for the given timeframe
exports.accounts = consumeAsync(countKeys('accountId', true))
// This is the number of unique sessions for the given timeframe
exports.uniqueSessions = consumeAsync(countKeys(['payload', 'sessionId'], true))

function countKeys (keys, unique) {
  return function (elements) {
    var list = _.map(elements, _.property(keys))
    list = _.compact(list)
    if (unique) {
      list = _.uniq(list)
    }
    return list.length
  }
}

exports.onboardingStats = consumeAsync(onboardingStats)

function onboardingStats (events) {
  var lastEvent = _.chain(events)
    .sortBy(propertyAccessors.eventId)
    .last()
    .value()

  if (!lastEvent) {
    return null
  }

  var numVisits = _.chain(events)
    .where({ accountId: lastEvent.accountId })
    .size()
    .value()

  var payload = lastEvent.payload
  return {
    domain: payload.href.host,
    url: payload.href.pathname !== '/'
      ? payload.href.host + payload.href.pathname
      : null,
    referrer: payload.$referrer,
    numVisits: numVisits,
    isMobile: payload.isMobile,
    geo: payload.geo
  }
}

// `consumeAsync` ensures the given function can be called with both
// synchronous and asynchronous values as arguments. The return value
// will be wrapped in a Promise.
function consumeAsync (fn, ctx) {
  ctx = ctx || null
  return function () {
    var args = [].slice.call(arguments)
    return Promise.all(args)
      .then(function (resolvedArgs) {
        return fn.apply(ctx, resolvedArgs)
      })
  }
}

function pairToRow (pair) {
  return { key: pair[0], count: pair[1] }
}
