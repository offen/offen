var handleFetchResponse = require('offen/fetch-response')

var getDatabase = require('./database')
var crypto = require('./crypto')
var getAccount = require('./get-account')
var decryptPrivateKey = require('./decrypt-private-key')

module.exports = getEvents

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
}

function getOperatorEvents (accountId) {
  var account
  return getAccount(accountId)
    .then(function (_account) {
      account = _account
      return decryptPrivateKey(account.encrypted_private_key)
    })
    .then(function (result) {
      return crypto.importPrivateKey(result.decrypted)
    })
    .then(function (privateKey) {
      var userSecretDecryptions = Object.keys(account.user_secrets)
        .map(function (hashedUserId) {
          var encrpytedSecret = account.user_secrets[hashedUserId]
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
      var eventDecryptions = account.events[accountId].map(function (event) {
        var userSecret = byHashedUserId[event.user_id]
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
}

// getEvents queries the server API for events using the given query parameters.
// Once the server has responded, it looks up the matching UserSecrets in the
// local database and decrypts and parses the previously encrypted event payloads.
function getEvents (query) {
  if (query && query.account_id) {
    return getOperatorEvents(query.account_id)
  }
  var url = new window.URL(`${process.env.SERVER_HOST}/events`)
  if (query) {
    url.search = new window.URLSearchParams(query)
  }
  return window
    .fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    .then(handleFetchResponse)
    .then(function (payload) {
      var events = payload.events
      return decryptUserEvents(events)
    })
    .catch(function (err) {
      // in case a user without a cookie tries to query for events a 400
      // will be returned
      if (err.status === 400) {
        return []
      }
      throw err
    })
}
