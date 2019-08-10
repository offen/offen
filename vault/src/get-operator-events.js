var _ = require('underscore')

var api = require('./api')
var queries = require('./queries')
var crypto = require('./crypto')

module.exports = getOperatorEventsWith(queries, api)
module.exports.getOperatorEventsWith = getOperatorEventsWith

function getOperatorEventsWith (queries, api) {
  return function (query) {
    return ensureSyncWith(queries, api)(query.accountId)
      .then(function (account) {
        return queries.getDefaultStats(query.accountId, query, account.privateKey)
          .then(function (stats) {
            return Object.assign(stats, { account: account })
          })
      })
  }
}

function fetchOperatorEventsWith (api, queries) {
  return function (accountId, params) {
    return api.getAccount(accountId, params)
      .then(function (account) {
        var returnedUserSecrets = Object.keys(account.userSecrets || {})
          .map(function (hashedUserId) {
            return [hashedUserId, account.userSecrets[hashedUserId]]
          })
        var returnedEvents = _.flatten(Object.values(account.events || {}), true)
        return {
          events: returnedEvents,
          encryptedUserSecrets: returnedUserSecrets,
          encryptedPrivateKey: account.encryptedPrivateKey,
          account: {
            accountId: account.accountId
          }
        }
      })
  }
}

function ensureSyncWith (queries, api) {
  return function (accountId) {
    return queries.getAllEventIds(accountId)
      .then(function (knownEventIds) {
        var fetchNewEvents = queries.getLatestEvent(accountId)
          .then(function (latestLocalEvent) {
            var params = latestLocalEvent
              ? { since: latestLocalEvent.eventId }
              : null
            return fetchOperatorEventsWith(api, queries)(accountId, params)
          })
        var pruneEvents = (knownEventIds.length
          ? api.getDeletedEvents(knownEventIds)
          : Promise.resolve({ eventIds: [] })
        )
          .then(function (response) {
            return response
              ? queries.deleteEvents.apply(null, [accountId].concat(response.eventIds))
              : null
          })
        return Promise.all([fetchNewEvents, pruneEvents])
          .then(function (results) {
            var payload = results[0]
            return api.decryptPrivateKey(payload.encryptedPrivateKey)
              .then(function (response) {
                return crypto.importPrivateKey(response.decrypted)
              })
              .then(function (privateCryptoKey) {
                var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateCryptoKey)
                var decryptedUserSecrets = payload.encryptedUserSecrets
                  .reduce(function (acc, pair) {
                    acc[pair[0]] = decryptWithAccountKey(pair[1])
                      .then(function (jwk) {
                        return crypto.importSymmetricKey(jwk)
                      })
                      .then(function (cryptoKey) {
                        return crypto.decryptSymmetricWith(cryptoKey)
                      })
                    return acc
                  }, {})
                var eventsWithTimestamps = payload.events
                  .map(function (event) {
                    var decryptPayload = event.userId === null
                      ? Promise.resolve(decryptWithAccountKey)
                      : decryptedUserSecrets[event.userId]
                    return decryptPayload
                      .then(function (decryptFn) {
                        return decryptFn(event.payload)
                      })
                      .then(function (decryptedPayload) {
                        return Object.assign(
                          { timestamp: decryptedPayload.timestamp }, event
                        )
                      })
                  })
                return Promise.all(eventsWithTimestamps)
                  .then(function (events) {
                    return Promise
                      .all([
                        queries.putEvents.apply(
                          null, [accountId].concat(events)
                        ),
                        queries.putEncryptedUserSecrets.apply(
                          null, [accountId].concat(payload.encryptedUserSecrets)
                        )
                      ])
                  })
                  .then(function (results) {
                    return Object.assign(payload.account, {
                      privateKey: privateCryptoKey
                    })
                  })
              })
          })
      })
  }
}
