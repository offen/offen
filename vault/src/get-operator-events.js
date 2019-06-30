var crypto = require('./crypto')
var api = require('./api')
var getDatabase = require('./database')
var defaultStats = require('./queries')

var NO_PENDING_EVENTS = '__NONEPENDING__'

module.exports = getOperatorEvents

function getOperatorEvents (query) {
  return ensureSync(query.accountId)
    .then(function (account) {
      return defaultStats(getDatabase(query.accountId), query)
        .then(function (stats) {
          return Object.assign(stats, { account: account })
        })
    })
}

function fetchOperatorEvents (accountId, params) {
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
        })
      return Promise.all(userSecretDecryptions)
    })
    .then(function (userSecrets) {
      var byHashedUserId = userSecrets.reduce(function (acc, next) {
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

function ensureSync (accountId) {
  var db = getDatabase(accountId)
  return db.events.toCollection().keys()
    .then(function (knownEventIds) {
      var fetchNewEvents = db.events
        .orderBy('eventId')
        .last()
        .then(function (latestLocalEvent) {
          var params = latestLocalEvent
            ? { since: latestLocalEvent.eventId }
            : null
          return fetchOperatorEvents(accountId, params)
        })
      var pruneEvents = (knownEventIds.length
        ? api.getDeletedEvents({ eventIds: knownEventIds })
        : Promise.resolve({ eventIds: [] })
      )
        .then(function (response) {
          return response
            ? db.events.bulkDelete(response.eventIds)
            : null
        })
      return Promise.all([fetchNewEvents, pruneEvents])
        .then(function (results) {
          var payload = results[0]
          return db.events.bulkAdd(payload.events)
            .then(function () {
              return payload.account
            })
        })
    })
}
