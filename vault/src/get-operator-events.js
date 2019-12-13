var _ = require('underscore')

var api = require('./api')
var queries = require('./queries')
var bindCrypto = require('./bind-crypto')
var decryptEvents = require('./decrypt-events')

module.exports = getOperatorEventsWith(queries, api, {})
module.exports.getOperatorEventsWith = getOperatorEventsWith

function getOperatorEventsWith (queries, api) {
  return function (query, authenticatedUser) {
    var matchingAccount = _.findWhere(authenticatedUser.accounts, { accountId: query.accountId })
    if (!matchingAccount) {
      return Promise.reject(new Error('No matching key found for account with id ' + query.accountId))
    }
    return ensureSyncWith(queries, api)(query.accountId, matchingAccount.keyEncryptionKey)
      .then(function (account) {
        return queries.getDefaultStats(query.accountId, query, account.privateJwk)
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
          account: account
        }
      })
  }
}

function ensureSyncWith (queries, api) {
  return bindCrypto(function (accountId, keyEncryptionJWK) {
    var crypto = this
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
            return crypto.decryptSymmetricWith(keyEncryptionJWK)(payload.account.encryptedPrivateKey)
              .then(function (privateJwk) {
                var userSecrets = payload.encryptedUserSecrets
                  .map(function (pair) {
                    return {
                      userId: pair[0],
                      value: pair[1]
                    }
                  })
                return decryptEvents(
                  payload.events, userSecrets, privateJwk
                )
                  .then(function (decryptedEvents) {
                    return decryptedEvents.map(function (decryptedEvent) {
                      // decryption might skip events on erroneous payloads
                      // so we need to look up the sibling like this instead
                      // of using the index
                      var match = _.findWhere(payload.events, { eventId: decryptedEvent.eventId })
                      return Object.assign(
                        { timestamp: decryptedEvent.payload.timestamp }, match
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
                    var result = Object.assign(payload.account, {
                      privateJwk: privateJwk
                    })
                    return result
                  })
              })
          })
      })
  })
}
