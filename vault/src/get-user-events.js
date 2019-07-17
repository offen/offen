var api = require('./api')
var crypto = require('./crypto')
var queries = require('./queries')

module.exports = getUserEventsWith(queries, api)
module.exports.getUserEventsWith = getUserEventsWith

// getEvents queries the server API for events using the given query parameters.
// Once the server has responded, it looks up the matching UserSecrets in the
// local database and decrypts and parses the previously encrypted event payloads.
function getUserEventsWith (queries, api) {
  return function (query) {
    return ensureSyncWith(queries, api)()
      .then(function () {
        return queries.getDefaultStats(null, query)
      })
  }
}

function ensureSyncWith (queries, api) {
  return function () {
    return queries.getAllEventIds(null)
      .then(function (eventIds) {
        return eventIds.length
          ? api.getDeletedEvents(eventIds, true)
            .catch(function () {
              // this might be called by users without a cookie
              return { eventIds: [] }
            })
          : null
      })
      .then(function (response) {
        return response
          ? queries.deleteEvents.apply(null, [null].concat(response.eventIds))
          : null
      })
      .then(function () {
        return queries.getLatestEvent(null)
      })
      .then(function (latestLocalEvent) {
        var params = latestLocalEvent
          ? { since: latestLocalEvent.eventId }
          : null
        return api.getEvents(params)
          .then(function (payload) {
            var events = payload.events
            return decryptUserEventsWith(queries)(events)
          })
          .catch(function (err) {
            // in case a user without a cookie tries to query for events a 400
            // will be returned
            if (err.status === 400) {
              return []
            }
            throw err
          })
      })
      .then(function (events) {
        return queries.putEvents.apply(null, [null].concat(events))
      })
  }
}

function decryptUserEventsWith (queries) {
  return function (eventsByAccountId) {
    var decrypted = Object.keys(eventsByAccountId)
      .map(function (accountId) {
        var withSecret = queries.getUserSecret(accountId)
          .then(function (userSecret) {
            if (!userSecret) {
              return function () {
                return null
              }
            }
            return crypto.decryptSymmetricWith(userSecret)
          })

        var events = eventsByAccountId[accountId]
        return events.map(function (event) {
          return withSecret
            .then(function (decryptEventPayload) {
              return decryptEventPayload(event.payload)
            })
            .then(function (decryptedPayload) {
              if (!decryptedPayload) {
                return null
              }
              return Object.assign({}, event, { payload: decryptedPayload })
            })
        })
      })
      .reduce(function (acc, next) {
        return acc.concat(next)
      }, [])

    return Promise.all(decrypted)
      .then(function (result) {
        return result.filter(function (v) {
          return v
        })
      })
  }
}
