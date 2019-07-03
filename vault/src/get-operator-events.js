var crypto = require('./crypto')
var api = require('./api')
var queries = require('./queries')

var NO_PENDING_EVENTS = '__NONEPENDING__'

module.exports = getOperatorEventsWith(queries, api)

function getOperatorEventsWith (queries, api) {
  return function (query) {
    return ensureSyncWith(queries, api)(query.accountId)
      .then(function (account) {
        return queries.getDefaultStats(query.accountId, query)
          .then(function (stats) {
            return Object.assign(stats, { account: account })
          })
      })
  }
}

function fetchOperatorEventsWith (api) {
  return function (accountId, params) {
    var account
    return api.getAccount(accountId, params)
      .then(function (_account) {
        account = _account
        // in case no new events were returned decrypting the private key of the
        // account can be skipped altogether
        if (Object.keys(account.events).length === 0) {
          var err = new Error('No pending events')
          err.status = NO_PENDING_EVENTS
          throw err
        }
        return api.decryptPrivateKey(account.encryptedPrivateKey)
      })
      .then(function (result) {
        return crypto.importPrivateKey(result.decrypted)
      })
      .then(function (privateKey) {
        var userSecretDecryptions = Object.keys(account.userSecrets)
          .filter(function (hashedUserId) {
            return account.userSecrets[hashedUserId] !== ''
          })
          .map(function (hashedUserId) {
            var encrpytedSecret = account.userSecrets[hashedUserId]
            var decryptSecret = crypto.decryptAsymmetricWith(privateKey)
            return decryptSecret(encrpytedSecret)
              .then(crypto.importSymmetricKey)
              .then(function (userKey) {
                return { userKey: userKey, userId: hashedUserId }
              })
              .catch(function () {
                return null
              })
          })
        return Promise.all(userSecretDecryptions)
      })
      .then(function (userSecrets) {
        var byHashedUserId = userSecrets
          .filter(function (v) {
            return v
          })
          .reduce(function (acc, next) {
            acc[next.userId] = next.userKey
            return acc
          }, {})

        // there might not be events for the given account at all
        var events = account.events[accountId] || []
        var eventDecryptions = events.map(function (event) {
          var userSecret = byHashedUserId[event.userId]
          if (!userSecret) {
            return
          }
          var decryptEventPayload = crypto.decryptSymmetricWith(userSecret)
          return decryptEventPayload(event.payload)
            .then(function (decryptedPayload) {
              return Object.assign({}, event, { payload: decryptedPayload })
            })
            .catch(function () {
              return null
            })
        })

        return Promise.all(eventDecryptions)
      })
      .then(function (results) {
        return {
          events: results.filter(function (r) {
            return r
          }),
          account: account
        }
      })
      .catch(function (err) {
        if (err.status === NO_PENDING_EVENTS) {
          return { events: [], account: account }
        }
        throw err
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
            return fetchOperatorEventsWith(api)(accountId, params)
          })
        var pruneEvents = (knownEventIds.length
          ? api.getDeletedEvents({ eventIds: knownEventIds })
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
            return queries.putEvents.apply(null, [accountId].concat(payload.events))
              .then(function () {
                return payload.account
              })
          })
      })
  }
}
