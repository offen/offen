var _ = require('underscore')
var startOfHour = require('date-fns/start_of_hour')
var startOfDay = require('date-fns/start_of_day')
var startOfWeek = require('date-fns/start_of_week')
var startOfMonth = require('date-fns/start_of_month')
var endOfHour = require('date-fns/end_of_hour')
var endOfDay = require('date-fns/end_of_day')
var endOfWeek = require('date-fns/end_of_week')
var endOfMonth = require('date-fns/end_of_week')
var subHours = require('date-fns/sub_hours')
var subDays = require('date-fns/sub_days')
var subWeeks = require('date-fns/sub_weeks')
var subMonths = require('date-fns/sub_months')

var getDatabase = require('./database')
var placeInBucket = require('./buckets')
var decryptEvents = require('./decrypt-events')

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

exports.getDefaultStats = getDefaultStatsWith(getDatabase)
exports.getDefaultStatsWith = getDefaultStatsWith
function getDefaultStatsWith (getDatabase) {
  return function (accountId, query, privateJwk) {
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

    var table = getDatabase(accountId).events
    // range is the number of units the query looks back from the given
    // start day
    var range = (query && query.range) || 7
    // resolution is the unit to group by when looking back
    var resolution = (query && query.resolution) || 'days'
    if (['hours', 'days', 'weeks', 'months'].indexOf(resolution) < 0) {
      return Promise.reject(new Error('Unknown resolution value: ' + resolution))
    }

    var now = (query && query.now) || new Date()
    var lowerBound = startOf[resolution](subtract[resolution](now, range - 1)).toJSON()
    var upperBound = endOf[resolution](now).toJSON()
    var eventsInBounds = table
      .where('timestamp')
      .between(lowerBound, upperBound)

    // There are two types of queries happening here: those that rely solely
    // on the IndexedDB indices, and those that require the event payload
    // (which might be encrypted and therefore not indexable).
    // Theoretically *all* queries could be done on the set of events after
    // encryption, yet it seems using the IndexedDB API where possible makes
    // more sense and performs better.
    var decryptedEvents = eventsInBounds
      .toArray(function (events) {
        // User events are already decrypted, so there is no need to proceed
        // further. This may seem counterintuitive at first, but it'd be
        // relatively pointless to store the encrypted events alongside a
        // key that is able to decrypt them.
        return accountId
          ? decryptEvents(
            events,
            getEncryptedUserSecretsWith(getDatabase)(accountId),
            privateJwk
          )
          : events
      })

    // `pageviews` is a list of basic metrics grouped by the given range
    // and resolution. It contains the number of pageviews, unique visitors
    // for operators and accounts for users.
    var pageviews = Promise.all(Array.from({ length: range })
      .map(function (num, distance) {
        var date = subtract[resolution](now, distance)

        var lowerBound = startOf[resolution](date).toJSON()
        var upperBound = endOf[resolution](date).toJSON()
        var eventsInBounds = table
          .where('timestamp')
          .between(lowerBound, upperBound)

        var pageviews = eventsInBounds
          .toArray(countKeys('userId', false))

        var visitors = eventsInBounds
          .toArray(countKeys('userId', true))

        var accounts = eventsInBounds
          .toArray(countKeys('accountId', true))

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

    // `uniqueUsers` is the number of unique user ids for the given
    //  timerange.
    var uniqueUsers = eventsInBounds
      .toArray(countKeys('userId', true))

    // `loss` is the percentage of anonymous events (i.e. events without a
    // user identifier) in the given timeframe.
    // indexed DB does not index on `null` (which maps to an anonymous event)
    // so the loss rate can simply be calculated by comparing the count
    // in an index with and one without userId
    var loss = eventsInBounds
      .toArray(function (allEvents) {
        if (allEvents.length === 0) {
          return 0
        }
        var notNull = allEvents.filter(function (event) {
          return event.userId !== null
        })
        return 1 - (notNull.length / allEvents.length)
      })

    // This is the number of unique accounts for the given timeframe
    var uniqueAccounts = eventsInBounds
      .toArray(countKeys('accountId', true))

    // This is the number of unique sessions for the given timeframe
    var uniqueSessions = decryptedEvents
      .then(function (events) {
        return _.chain(events)
          .pluck('payload')
          .pluck('sessionId')
          // anonymous events do not have a sessionId prop
          .compact()
          .unique()
          .size()
          .value()
      })

    // The bounce rate is calculated as the percentage of session identifiers
    // in the timerange that are associated with one event only, i.e. there
    // has been no follow-up event.
    var bounceRate = decryptedEvents
      .then(function (events) {
        var sessionCounts = _.chain(events)
          .pluck('payload')
          .pluck('sessionId')
          .compact()
          .countBy(function (identifier) {
            return identifier
          })
          .values()
          .value()

        if (sessionCounts.length === 0) {
          return 0
        }

        // The bounce rate is the percentage of sessions where there is only
        // one event with the respective identifier in the given se
        var bounces = sessionCounts
          .filter(function (viewsInSession) {
            return viewsInSession === 1
          })
        return bounces.length / sessionCounts.length
      })

    // `referrers` is the list of referrer values, grouped by host name. Common
    // referrers (i.e. search engines or apps) will replaced with a human-friendly
    // name assigned to their bucket.
    var referrers = decryptedEvents
      .then(function (events) {
        var perHost = events
          .filter(function (event) {
            if (event.userId === null || !event.payload || !event.payload.referrer) {
              return false
            }
            var referrerUrl = new window.URL(event.payload.referrer)
            var hrefUrl = new window.URL(event.payload.href)
            return referrerUrl.host !== hrefUrl.host
          })
          .map(function (event) {
            var url = new window.URL(event.payload.referrer)
            return url.host || url.href
          })
          .filter(function (referrerValue) {
            return referrerValue
          })
          .map(placeInBucket)
          .reduce(function (acc, referrerValue) {
            acc[referrerValue] = acc[referrerValue] || 0
            acc[referrerValue]++
            return acc
          }, {})
        var unique = Object.keys(perHost)
          .map(function (host) {
            return { host: host, pageviews: perHost[host] }
          })
        return _.sortBy(unique, 'pageviews').reverse()
      })

    // `pages` contains all pages visited sorted by the number of pageviews.
    // URLs are stripped off potential query strings before grouping.
    var pages = decryptedEvents
      .then(function (events) {
        return events
          .filter(function (event) {
            return event.userId !== null && event.payload.href
          })
          .map(function (event) {
            return [event.accountId, event.payload.href]
          })
      })
      .then(function (keys) {
        var cleanedKeys = keys.map(function (pair) {
          var url = new window.URL(pair[1])
          var strippedHref = url.origin + url.pathname
          return [pair[0], strippedHref]
        })

        var byAccount = cleanedKeys.reduce(function (acc, next) {
          acc[next[0]] = acc[next[0]] || []
          acc[next[0]].push(next)
          return acc
        }, {})

        return _.chain(byAccount)
          .values()
          .map(function (pageviews) {
            var counts = _.countBy(pageviews, function (pageview) {
              return pageview[1]
            })
            return Object.keys(counts).map(function (url) {
              return { url: url, pageviews: counts[url] }
            })
          })
          .flatten(true)
          .sortBy('pageviews')
          .reverse()
          .value()
      })

    return Promise
      .all([
        uniqueUsers,
        uniqueAccounts,
        uniqueSessions,
        referrers,
        pages,
        pageviews,
        bounceRate,
        loss
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
          resolution: resolution,
          range: range
        }
      })
  }
}

var TYPE_USER_SECRET = 'USER_SECRET'
var TYPE_ENCRYPTED_USER_SECRET = 'ENCRYPTED_USER_SECRET'

exports.getUserSecret = getUserSecretWith(getDatabase)
exports.getUserSecretWith = getUserSecretWith
function getUserSecretWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .get({ type: TYPE_USER_SECRET })
      .then(function (result) {
        if (result) {
          return result.value
        }
        return null
      })
  }
}

exports.putUserSecret = putUserSecretWith(getDatabase)
exports.putUserSecretWith = putUserSecretWith
function putUserSecretWith (getDatabase) {
  return function (accountId, userSecret) {
    var db = getDatabase(accountId)
    return db.keys
      .put({
        type: TYPE_USER_SECRET,
        value: userSecret
      })
  }
}

exports.deleteUserSecret = deleteUserSecretWith(getDatabase)
exports.deleteUserSecretWith = deleteUserSecretWith
function deleteUserSecretWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .where({ type: TYPE_USER_SECRET })
      .delete()
  }
}

exports.putEncryptedUserSecrets = putEncryptedUserSecretsWith(getDatabase)
exports.putEncryptedUserSecretsWith = putEncryptedUserSecretsWith
function putEncryptedUserSecretsWith (getDatabase) {
  // user secrets are expected to be passed in [userId, secret] tuples
  return function (/* accountId, ...userSecrets */) {
    var args = [].slice.call(arguments)
    var accountId = args.shift()

    var db = getDatabase(accountId)
    var records = args.map(function (pair) {
      return {
        type: TYPE_ENCRYPTED_USER_SECRET,
        userId: pair[0],
        value: pair[1]
      }
    })
    return db.keys
      .bulkPut(records)
  }
}

exports.getLatestEvent = getLatestEventWith(getDatabase)
exports.getLatestEventWith = getLatestEventWith
function getLatestEventWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.events
      .orderBy('eventId')
      .last()
      .then(function (latestLocalEvent) {
        return latestLocalEvent || null
      })
  }
}

exports.getAllEventIds = getAllEventIdsWith(getDatabase)
exports.getAllEventIdsWith = getAllEventIdsWith
function getAllEventIdsWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.events.toCollection().keys()
  }
}

exports.putEvents = putEventsWith(getDatabase)
exports.putEventsWith = putEventsWith
function putEventsWith (getDatabase) {
  return function (/* accountId, ...events */) {
    var args = [].slice.call(arguments)
    var accountId = args.shift()
    var db = getDatabase(accountId)
    // events data is saved in the shape supplied by the server
    return db.events.bulkAdd(args)
  }
}

exports.deleteEvents = deleteEventsWith(getDatabase)
exports.deleteEventsWith = deleteEventsWith
function deleteEventsWith (getDatabase) {
  return function (/* accountId, ...eventIds */) {
    var args = [].slice.call(arguments)
    var accountId = args.shift()
    var db = getDatabase(accountId)
    return db.events.bulkDelete(args)
  }
}

exports.purge = purgeWith(getDatabase)
exports.purgeWith = purgeWith
function purgeWith (getDatabase) {
  return function () {
    var db = getDatabase(null)
    return db.events.clear()
  }
}

function getEncryptedUserSecretsWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .where('type')
      .equals(TYPE_ENCRYPTED_USER_SECRET)
      .toArray()
  }
}

function countKeys (keys, unique) {
  return function (elements) {
    var list = _.chain(elements)
    if (!Array.isArray(keys)) {
      keys = [keys]
    }
    keys.forEach(function (key) {
      list = list.pluck(key)
    })
    list = list.compact()
    if (unique) {
      list = list.uniq()
    }
    return list.size().value()
  }
}
