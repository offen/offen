/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var api = require('./api')
var bindCrypto = require('./bind-crypto')
var queries = require('./queries')
var storage = require('./storage')
var eventStore = require('./event-store')

var LOCAL_SECRET_ID = 'local'

module.exports = getUserEventsWith(queries, eventStore, storage, api)
module.exports.getUserEventsWith = getUserEventsWith

// getEvents queries the server API for events using the given query parameters.
// Once the server has responded, it looks up the matching UserSecrets in the
// local database and decrypts and parses the previously encrypted event payloads.
function getUserEventsWith (queries, eventStore, storage, api) {
  return function (query) {
    return ensureSyncWith(eventStore, storage, api)()
      .then(function () {
        return queries.getDefaultStats(null, query)
      })
  }
}

function ensureSyncWith (eventStore, storage, api) {
  return function () {
    return storage.getLastKnownCheckpoint(null)
      .then(function (checkpoint) {
        var params = checkpoint
          ? { since: checkpoint }
          : null
        return api.getEvents(params)
          .catch(function (err) {
            // in case a user without a cookie tries to query for events a 400
            // will be returned
            if (err.status === 400) {
              return { events: [] }
            }
            throw err
          })
          .then(function (payload) {
            var events = payload.events
            return Promise.all([
              decryptUserEventsWith(storage)(events),
              payload.sequence
                ? storage.updateLastKnownCheckpoint(null, payload.sequence)
                : null,
              payload.deletedEvents
                ? eventStore.deleteEvents(null, payload.deletedEvents)
                : null
            ])
          })
      })
      .then(function (results) {
        var events = results[0].map(function (event) {
          // User events come without any userId or secretId attached as it's
          // implicitly ensured it is always the same value and saving it locally
          // would just create a possible leak of identifiers. We need to index on
          // this value in IndexedDB though, so a fixed value is used instead
          // of using real data.
          return Object.assign(
            event, { secretId: LOCAL_SECRET_ID }
          )
        })
        return eventStore.putEvents(null, events)
      })
  }
}

function decryptUserEventsWith (storage) {
  return bindCrypto(function (eventsByAccountId) {
    var crypto = this
    var decrypted = Object.keys(eventsByAccountId)
      .map(function (accountId) {
        var withSecret = storage.getUserSecret(accountId)
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
