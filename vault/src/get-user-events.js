var api = require('./api')
var getDatabase = require('./database')
var crypto = require('./crypto')
var defaultStats = require('./queries')

module.exports = getUserEvents

// getEvents queries the server API for events using the given query parameters.
// Once the server has responded, it looks up the matching UserSecrets in the
// local database and decrypts and parses the previously encrypted event payloads.
function getUserEvents (query) {
  return ensureSync()
    .then(function () {
      return defaultStats(getDatabase(), query)
    })
}

function ensureSync () {
  var db = getDatabase()
  // this is here until sync is sorted out
  return db.events.clear()
    .then(function () {
      return db.events
        .orderBy('eventId')
        .last()
        .then(function (latestLocalEvent) {
          var params = latestLocalEvent
            ? { since: latestLocalEvent.eventId }
            : null
          return api.getEvents(params)
            .then(function (payload) {
              var events = payload.events
              return decryptUserEvents(events)
            })
            .catch(function (err) {
              // in case a user without a cookie tries to query for events a 400
              // will be returned
              if (err.status === 400) {
                return []
              }
              throw err
            })
            .then(function (events) {
              return db.events.bulkAdd(events)
            })
        })
    })
}

function decryptUserEvents (eventsByAccountId) {
  var db = getDatabase()
  var decrypted = Object.keys(eventsByAccountId)
    .map(function (accountId) {
      var withSecret = db.secrets.get({ accountId: accountId })
        .then(function (result) {
          return crypto.decryptSymmetricWith(result.userSecret)
        })

      var events = eventsByAccountId[accountId]
      return events.map(function (event) {
        return withSecret.then(function (decryptEventPayload) {
          return decryptEventPayload(event.payload)
            .then(function (decryptedPayload) {
              return Object.assign({}, event, { payload: decryptedPayload })
            })
        })
      })
    })
    .reduce(function (acc, next) {
      return acc.concat(next)
    }, [])

  return Promise.all(decrypted)
}
