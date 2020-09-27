/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var placeInBucket = require('./buckets')

// `loss` is the percentage of anonymous events (i.e. events without a
// user identifier) in the given set of events.
exports.loss = consumeAsync(loss)

function loss (events) {
  var totalCount = events.length
  if (totalCount === 0) {
    return 0
  }
  var nonNullCount = countKeys('secretId', false)(events)
  return 1 - (nonNullCount / totalCount)
}

// The bounce rate is calculated as the percentage of session identifiers
// in the set of events that are associated with one event only, i.e. there
// has been no follow-up event.
exports.bounceRate = consumeAsync(bounceRate)

function bounceRate (events) {
  var sessionCounts = 0
  var bounces = _.chain(events)
    .map(_.property(['payload', 'sessionId']))
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
  return _referrers(events, function (set) {
    return set
      .map(function (event) {
        return event.payload.referrer.host || event.payload.referrer.href
      })
      .map(placeInBucket)
  })
}

// `campaigns` groups the referrer values by their `utm_campaign` if present
exports.campaigns = consumeAsync(_queryParam('utm_campaign'))

function _queryParam (key) {
  return function (events) {
    return _.chain(events)
      .filter(_.property(['payload', 'href']))
      .map(function (event) {
        return {
          sessionId: event.payload.sessionId,
          value: event.payload.rawHref
            ? event.payload.rawHref.searchParams.get(key)
            : event.payload.href.searchParams.get(key)
        }
      })
      .uniq(false, JSON.stringify)
      .filter(function (item) {
        return item.value && item.sessionId
      })
      .groupBy('value')
      .pairs()
      .map(function (pair) {
        var value = pair[0]
        var items = pair[1]
        var associatedViews = _.chain(items)
          .pluck('sessionId')
          .uniq()
          .map(function (sessionId) {
            return events.filter(function (event) {
              return event.payload && event.payload.sessionId === sessionId
            })
          })
          .flatten(true)
          .size()
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

function _referrers (events, groupFn) {
  var uniqueForeign = events
    .filter(function (event) {
      if (event.secretId === null || !event.payload || !event.payload.referrer) {
        return false
      }
      return event.payload.referrer.host !== event.payload.href.host
    })
    .reduce(function (acc, event) {
      function unknownSession (knownEvent) {
        return knownEvent.payload.sessionId !== event.payload.sessionId
      }
      if (_.every(acc, unknownSession)) {
        acc.push(event)
      }
      return acc
    }, [])

  var sessionIds = _.map(uniqueForeign, _.property(['payload', 'sessionId']))
  var values = groupFn(uniqueForeign)
  return _.chain(values)
    .zip(sessionIds)
    .filter(_.head)
    .groupBy(_.head)
    .pairs()
    .map(function (pair) {
      var sessions = _.map(pair[1], _.last)
      var associatedViews = _.filter(events, function (event) {
        return event.payload &&
          event.payload.sessionId &&
          _.contains(sessions, event.payload.sessionId)
      })
      return {
        key: pair[0],
        count: [
          sessions.length,
          associatedViews.length / sessions.length
        ]
      }
    })
    .sortBy(function (row) { return row.count[0] })
    .reverse()
    .value()
}

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
    .filter(function (event) {
      return event.secretId !== null && event.payload && event.payload.href
    })

  if (perUser) {
    // in this branch, only the most recent event for each user
    // will be considered
    var sortBy = _.property(['payload', 'timestamp'])
    result = result
      .groupBy('secretId')
      .pairs()
      .map(function (pair) {
        return _.last(
          _.sortBy(pair[1], sortBy)
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
        .map(function (pair) {
          return { key: pair[0], count: pair[1] }
        })
        .value()
    })
    .flatten(true)
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
    .map(_.property(['payload', 'pageload']))
    .compact()
    .filter(function (value) { return value > 0 })
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
    .filter(function (e) {
      return e.secretId !== null && e.payload && e.payload.sessionId && e.payload.href
    })
    .groupBy(function (e) {
      return e.payload.sessionId
    })
    .map(function (events, key) {
      if (events.length < 2) {
        return null
      }
      // for each session, we are only interested in the first
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .last()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .compact()
    .countBy(_.identity)
    .pairs()
    .map(function (pair) {
      return { key: pair[0], count: pair[1] }
    })
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
      return e.secretId !== null && e.payload && e.payload.sessionId && e.payload.href
    })
    .groupBy(function (e) {
      return e.payload.sessionId
    })
    .map(function (events, key) {
      // for each session, we are only interested in the first
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .first()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(function (pair) {
      return { key: pair[0], count: pair[1] }
    })
    .sortBy('count')
    .reverse()
    .value()
}

// `mobileShare` returns the percentage of events flagged as mobile
// in the given set of events.
exports.mobileShare = consumeAsync(mobileShare)

function mobileShare (events) {
  var allEvents
  var mobileEvents = _.chain(events)
    .filter('secretId')
    .tap(function (events) {
      allEvents = events.length
    })
    .filter(_.property(['payload', 'isMobile']))
    .size()
    .value()

  if (allEvents === 0) {
    return null
  }
  return mobileEvents / allEvents
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
    var referenceIds = _.chain(head).pluck('secretId').compact().uniq().value()
    var innerResult = chunks.reduce(function (acc, next) {
      var share
      if (referenceIds.length === 0) {
        share = 0
      } else {
        var matching = _.chain(next)
          .pluck('secretId').compact().uniq()
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

// `returningUsers` calculates the percentage of returning visitors in the given range
// as compared to the list of all known events
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
    .pluck('secretId')
    .compact()
    .uniq()
    .value()

  var usersInRange = _.chain(events)
    .pluck('secretId')
    .compact()
    .uniq()
    .value()

  if (usersInRange.length === 0) {
    return 0
  }

  var newUsers = _.chain(usersInRange)
    .filter(function (secretId) {
      return !_.contains(usersBeforeRange, secretId)
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
