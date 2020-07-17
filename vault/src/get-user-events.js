/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var api = require('./api')
var bindCrypto = require('./bind-crypto')
var queries = require('./queries')

var LOCAL_SECRET_ID = 'local'

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
        events = events.map(function (event) {
          // User events come without any userId or secretId attached as it's
          // implicitly ensured it is always the same value and saving it locally
          // would just create a possible leak of identifiers. We need to index on
          // this value in IndexedDB though, so a fixed value is used instead
          // of using real data.
          return Object.assign(
            event, { secretId: LOCAL_SECRET_ID }
          )
        })
        return queries.putEvents.apply(null, [null].concat(events))
      })
  }
}

function decryptUserEventsWith (queries) {
  return bindCrypto(function (eventsByAccountId) {
    var crypto = this
    var decrypted = Object.keys(eventsByAccountId)
      .map(function (accountId) {
        var withSecret = queries.getUserSecret(accountId)
          .then(function (jwk) {
            if (!jwk) {
              return function () {
                return null
              }
            }
            return crypto.decryptSymmetricWith(jwk)
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
      .then(function (results) {
        return results.filter(Boolean)
      })
  })
}
