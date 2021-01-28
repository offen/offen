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

const _ = require('underscore')

const placeInBucket = require('./buckets')

const propertyAccessors = {
  sessionId: _.property(['payload', 'sessionId']),
  href: _.property(['payload', 'href']),
  timestamp: _.property(['payload', 'timestamp']),
  pageload: _.property(['payload', 'pageload']),
  isMobile: _.property(['payload', 'isMobile']),
  eventId: _.property('eventId')
}

// The bounce rate is calculated as the percentage of session identifiers
// in the set of events that are associated with one event only, i.e. there
// has been no follow-up event.
exports.bounceRate = consumeAsync(bounceRate)

function bounceRate (events) {
  let sessionCounts = 0
  const bounces = _.chain(events)
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
  return _referrers(events, function (set) {
    return set
      .map(function (event) {
        return placeInBucket(
          event.payload.referrer.host || event.payload.referrer.href
        )
      })
  })
}

// `campaigns` groups the referrer values by their `utm_campaign` if present
exports.campaigns = consumeAsync(_queryParam('utm_campaign'))

function _queryParam (key) {
  return function (events) {
    return _.chain(events)
      .filter(propertyAccessors.href)
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
        const value = pair[0]
        const items = pair[1]
        const associatedViews = _.chain(items)
          .pluck('sessionId')
          .uniq()
          .map(function (sessionId) {
            return events.filter(function (event) {
              return event.payload.sessionId === sessionId
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
  const uniqueForeign = _.chain(events)
    .filter(function (event) {
      if (!event.payload.referrer) {
        return false
      }
      return event.payload.referrer.host !== event.payload.href.host
    })
    .uniq(false, propertyAccessors.sessionId)
    .value()

  const sessionIds = _.map(uniqueForeign, propertyAccessors.sessionId)
  const values = groupFn(uniqueForeign)
  return _.chain(values)
    .zip(sessionIds)
    .filter(_.head)
    .groupBy(_.head)
    .pairs()
    .map(function (pair) {
      const sessions = _.reduce(pair[1], function (acc, next) {
        acc[_.last(next)] = true
        return acc
      }, {})
      const numSessions = _.size(sessions)
      const associatedViews = _.filter(events, function (event) {
        return event.payload.sessionId &&
          sessions[event.payload.sessionId]
      })
      return {
        key: pair[0],
        count: [
          numSessions,
          associatedViews.length / numSessions
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
  let result = _.chain(events)
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
      const strippedHref = event.payload.href.origin + event.payload.href.pathname
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
    .sortBy('count')
    .reverse()
    .value()
}

// `avgPageload` calculates the average pageload time of the given
// set of events
exports.avgPageload = consumeAsync(avgPageload)

function avgPageload (events) {
  let count
  const total = _.chain(events)
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
  const views = countKeys(['payload', 'sessionId'], false)(events)
  const uniqueSessions = countKeys(['payload', 'sessionId'], true)(events)
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
      const landing = _.chain(events)
        .sortBy('timestamp')
        .last()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(pairToRow)
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
      const landing = _.chain(events)
        .sortBy('timestamp')
        .first()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(pairToRow)
    .sortBy('count')
    .reverse()
    .value()
}

// `mobileShare` returns the percentage of events flagged as mobile
// in the given set of events.
exports.mobileShare = consumeAsync(mobileShare)

function mobileShare (events) {
  const allEvents = events.length
  const mobileEvents = _.chain(events)
    .filter(propertyAccessors.isMobile)
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
  const chunks = [].slice.call(arguments)
  const result = []
  while (chunks.length) {
    const head = chunks.shift()
    const referenceIds = _.chain(head).pluck('secretId').uniq().value()
    const innerResult = chunks.reduce(function (acc, next) {
      let share
      if (referenceIds.length === 0) {
        share = 0
      } else {
        const matching = _.chain(next)
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
  const oldestEventIdInRange = _.chain(events)
    .pluck('eventId')
    .sortBy()
    .head()
    .value()

  const usersBeforeRange = _.chain(allEvents)
    .filter(function (event) {
      return event.eventId < oldestEventIdInRange
    })
    .reduce(function (acc, next) {
      acc[next.secretId] = true
      return acc
    }, {})
    .value()

  const usersInRange = _.chain(events)
    .pluck('secretId')
    .uniq()
    .value()

  if (usersInRange.length === 0) {
    return 0
  }

  const newUsers = _.chain(usersInRange)
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
    let list = _.map(elements, _.property(keys))
    list = _.compact(list)
    if (unique) {
      list = _.uniq(list)
    }
    return list.length
  }
}

exports.onboardingStats = consumeAsync(onboardingStats)

function onboardingStats (events) {
  const lastEvent = _.chain(events)
    .sortBy(propertyAccessors.eventId)
    .last()
    .value()

  if (!lastEvent) {
    return null
  }

  const numVisits = _.chain(events)
    .where({ accountId: lastEvent.accountId })
    .size()
    .value()

  const payload = lastEvent.payload
  return {
    domain: payload.href.host,
    url: payload.href.pathname !== '/'
      ? payload.href.host + payload.href.pathname
      : null,
    referrer: payload.referrer && payload.referrer.host !== payload.href.host
      ? placeInBucket(payload.referrer.host)
      : null,
    numVisits: numVisits,
    isMobile: payload.isMobile
  }
}

// `consumeAsync` ensures the given function can be called with both
// synchronous and asynchronous values as arguments. The return value
// will be wrapped in a Promise.
function consumeAsync (fn, ctx) {
  ctx = ctx || null
  return function () {
    const args = [].slice.call(arguments)
    return Promise.all(args)
      .then(function (resolvedArgs) {
        return fn.apply(ctx, resolvedArgs)
      })
  }
}

function pairToRow (pair) {
  return { key: pair[0], count: pair[1] }
}
