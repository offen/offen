var api = require('./api')
var getDatabase = require('./database')
var crypto = require('./crypto')

module.exports = getUserEvents

// getEvents queries the server API for events using the given query parameters.
// Once the server has responded, it looks up the matching UserSecrets in the
// local database and decrypts and parses the previously encrypted event payloads.
function getUserEvents (query) {
  return api.getEvents(query)
    .then(function (payload) {
      var events = payload.events
      return decryptUserEvents(events)
    })
    .catch(function (err) {
      // in case a user without a cookie tries to query for events a 400
      // will be returned
      if (err.status === 400) {
        return { events: [] }
      }
      throw err
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
    .then(function (events) {
      return { events: events }
    })
}
