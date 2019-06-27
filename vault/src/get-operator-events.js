var crypto = require('./crypto')
var api = require('./api')
var getDatabase = require('./database')
var defaultStats = require('./queries')

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

function fetchOperatorEvents (accountId) {
  var account
  return api.getAccount(accountId)
    .then(function (_account) {
      account = _account
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
      return results.filter(function (r) { return r })
    })
    .then(function (results) {
      delete account.events
      return { events: results, account: account }
    })
}

function ensureSync (accountId) {
  var db = getDatabase(accountId)
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
          return fetchOperatorEvents(accountId, params)
            .then(function (payload) {
              return db.events.bulkAdd(payload.events).then(function () {
                return payload.account
              })
            })
        })
    })
}
