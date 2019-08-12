var _ = require('underscore')

var api = require('./api')
var queries = require('./queries')
var crypto = require('./crypto')
var decryptEvents = require('./decrypt-events')

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
          .filter(function (pair) {
            return pair[1]
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
                var userSecrets = payload.encryptedUserSecrets
                  .map(function (pair) {
                    return {
                      userId: pair[0],
                      value: pair[1]
                    }
                  })
                return decryptEvents(
                  payload.events, userSecrets, privateCryptoKey
                )
                  .then(function (decryptedEvents) {
                    return payload.events.map(function (event, index) {
                      return Object.assign(
                        { timestamp: decryptedEvents[index].payload.timestamp }, event
                      )
                    })
                  })
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
