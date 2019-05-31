var Unibabel = require('unibabel').Unibabel
var handleFetchResponse = require('offen/fetch-response')

var getDatabase = require('./database')
var getAccount = require('./get-account')
var decryptPrivateKey = require('./decrypt-private-key')

module.exports = getEvents

function decryptEventWith (userSecret) {
  return function (event) {
    return window.crypto.subtle
      .decrypt({
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      }, userSecret, Unibabel.base64ToArr(event.payload))
      .then(function (decrypted) {
        var payloadAsString = Unibabel.utf8ArrToStr(new Uint8Array(decrypted))
        return Object.assign({}, event, { payload: JSON.parse(payloadAsString) })
      })
  }
}

function decryptUserEvents (eventsByAccountId) {
  var db = getDatabase()
  var decrypted = Object.keys(eventsByAccountId)
    .map(function (accountId) {
      var withSecret = db.secrets.get({ accountId: accountId })
        .then(function (result) {
          return decryptEventWith(result.userSecret)
        })

      var events = eventsByAccountId[accountId]
      return events.map(function (event) {
        return withSecret.then(function (decryptEvent) {
          return decryptEvent(event)
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
      return window.crypto.subtle.importKey(
        'jwk',
        result.decrypted,
        {
          name: 'RSA-OAEP',
          hash: { name: 'SHA-256' }
        },
        false,
        ['decrypt']
      )
    })
    .then(function (privateKey) {
      var userSecretDecryptions = Object.keys(account.user_secrets)
        .map(function (hashedUserId) {
          return window.crypto.subtle
            .decrypt(
              { name: 'RSA-OAEP' },
              privateKey,
              Unibabel.base64ToArr(account.user_secrets[hashedUserId])
            )
            .then(function (decrypted) {
              var payloadAsString = Unibabel.utf8ArrToStr(new Uint8Array(decrypted))
              return JSON.parse(payloadAsString)
            })
            .then(function (jwk) {
              return window.crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'AES-CTR' },
                false,
                ['encrypt', 'decrypt']
              )
            })
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
        var decryptEvent = decryptEventWith(userSecret)
        return decryptEvent(event)
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
