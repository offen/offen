var _ = require('underscore')
var dexie = require('dexie')
var startOfHour = require('date-fns/start_of_hour')
var startOfDay = require('date-fns/start_of_day')
var startOfWeek = require('date-fns/start_of_week')
var startOfMonth = require('date-fns/start_of_month')
var endOfHour = require('date-fns/end_of_hour')
var endOfDay = require('date-fns/end_of_day')
var endOfWeek = require('date-fns/end_of_week')
var endOfMonth = require('date-fns/end_of_week')
var subMinutes = require('date-fns/sub_minutes')
var subHours = require('date-fns/sub_hours')
var subDays = require('date-fns/sub_days')
var subWeeks = require('date-fns/sub_weeks')
var subMonths = require('date-fns/sub_months')
var addDays = require('date-fns/add_days')

var getDatabase = require('./database')
var decryptEvents = require('./decrypt-events')
var stats = require('./stats')

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
      .toArray()

    var realtimeLowerBound = subMinutes(now, 15).toJSON()
    var realtimeUpperBound = now.toJSON()
    var realtimeEvents = table
      .where('timestamp')
      .between(realtimeLowerBound, realtimeUpperBound)
      .toArray()

    // There are two types of queries happening here: those that rely solely
    // on the IndexedDB indices, and those that require the event payload
    // (which might be encrypted and therefore not indexable).
    // Theoretically *all* queries could be done on the set of events after
    // encryption, yet it seems using the IndexedDB API where possible makes
    // more sense and performs better.
    var decryptions = [eventsInBounds, realtimeEvents].map(function (query) {
      return query
        .then(function (events) {
          // User events are already decrypted, so there is no need to proceed
          // further. This may seem counterintuitive at first, but it'd be
          // relatively pointless to store the encrypted events alongside a
          // key that is able to decrypt them.
          return accountId
            ? decryptEvents(
              events,
              getEncryptedSecretsWith(getDatabase)(accountId),
              privateJwk
            )
            : events
        })
        .then(function (events) {
          return events.map(function (event) {
            if (event.secretId === null || !event.payload) {
              return event
            }
            event.payload.referrer = event.payload.referrer && new window.URL(event.payload.referrer)
            event.payload.href = event.payload.href && new window.URL(event.payload.href)
            return event
          })
        })
    })
    var decryptedEvents = decryptions[0]
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
          .toArray()

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
    var loss = stats.loss(decryptedEvents)
    var uniqueAccounts = stats.accounts(eventsInBounds)
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

    var realtime = decryptions[1]
    var livePages = stats.activePages(realtime)
    var liveUsers = stats.visitors(realtime)

    var retentionChunks = []
    for (var i = 0; i < 4; i++) {
      var currentChunkUpperBound = subtract.days(now, i * 7).toJSON()
      var currentChunkLowerBound = subtract.days(now, (i + 1) * 7).toJSON()
      var chunk = table
        .where('timestamp')
        .between(currentChunkLowerBound, currentChunkUpperBound)
        .toArray()
      retentionChunks.push(chunk)
    }
    var retentionMatrix = Promise.all(retentionChunks)
      .then(function (chunks) {
        return stats.retention.apply(stats, chunks)
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
        retentionMatrix
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
          resolution: resolution,
          range: range
        }
      })
  }
}

var TYPE_USER_SECRET = 'USER_SECRET'
var TYPE_ENCRYPTED_SECRET = 'ENCRYPTED_SECRET'

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
        // This is a nifty hack to work around the following situation:
        // When run in a non-Auditorium context, Safari throws an OpenFailedError
        // when trying to access IndexedDB which is we we need to fall back to
        // cookie based persistence for user secrets.
        // When run in the context of the Auditorium, Safari allows IndexedDB
        // to be accessed, but the lookup will not yield any result. This means
        // we throw this error to make another lookup attempt before returning
        // null.
        throw new dexie.OpenFailedError('Trying to fall back to cookie based persistence.')
      })
      .catch(dexie.OpenFailedError, function () {
        var cookieData = document.cookie.split(';')
          .reduce(function (acc, pair) {
            var chunks = pair.split('=')
            acc[chunks[0]] = chunks[1]
            return acc
          }, {})

        var lookupKey = TYPE_USER_SECRET + '-' + accountId
        if (cookieData[lookupKey]) {
          return JSON.parse(cookieData[lookupKey])
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
      .catch(dexie.OpenFailedError, function () {
        var isLocalhost = window.location.hostname === 'localhost'
        var sameSite = isLocalhost ? 'Lax' : 'None'

        var entry = {}
        entry[TYPE_USER_SECRET + '-' + accountId] = JSON.stringify(userSecret)
        Object.assign(entry, {
          Path: '/vault',
          SameSite: sameSite,
          Secure: !isLocalhost,
          expires: addDays(new Date(), 365).toUTCString()
        })
        document.cookie = serializeCookie(entry)
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
      .catch(dexie.OpenFailedError, function () {
        var entry = {}
        entry[TYPE_USER_SECRET + '-' + accountId] = ''
        Object.assign(entry, {
          expires: new Date(0).toUTCString()
        })
        document.cookie = serializeCookie(entry)
      })
  }
}

exports.putEncryptedSecrets = putEncryptedSecretsWith(getDatabase)
exports.putEncryptedSecretsWith = putEncryptedSecretsWith
function putEncryptedSecretsWith (getDatabase) {
  // user secrets are expected to be passed in [secretUd, secret] tuples
  return function (/* accountId, ...userSecrets */) {
    var args = [].slice.call(arguments)
    var accountId = args.shift()

    var db = getDatabase(accountId)
    var records = args.map(function (pair) {
      return {
        type: TYPE_ENCRYPTED_SECRET,
        secretId: pair[0],
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

function getEncryptedSecretsWith (getDatabase) {
  return function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .where('type')
      .equals(TYPE_ENCRYPTED_SECRET)
      .toArray()
  }
}

function serializeCookie (obj) {
  return Object.keys(obj)
    .map(function (key) {
      if (obj[key] === true) {
        return key
      }
      if (obj[key] === false) {
        return null
      }
      return key + '=' + obj[key]
    })
    .filter(Boolean)
    .join(';')
}
