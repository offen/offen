/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var bindCrypto = require('./bind-crypto')
var api = require('./api')
var queries = require('./queries')

module.exports = ensureUserSecretWith(api, queries)
module.exports.ensureUserSecretWith = ensureUserSecretWith

// ensureUserSecret looks up the UserSecret for the given accountId. In case it
// is not present in the local database or `flush` is passed, it initiates a
// new exchange of secrets and stores the result in the local database.
function ensureUserSecretWith (api, queries) {
  return function (accountId, flush) {
    var before = Promise.resolve()
    if (flush) {
      before = queries.deleteUserSecret(accountId)
    }

    return before
      .then(function () {
        return queries.getUserSecret(accountId)
      })
      .then(function (jwk) {
        if (jwk) {
          return jwk
        }
        return exchangeUserSecret(api, accountId)
      })
      .then(function (jwk) {
        // persisting the secret every time we look it up
        // ensures it does not expire while in use
        return queries.putUserSecret(accountId, jwk)
          .then(function () {
            return jwk
          })
      })
  }
}

var generateNewUserSecret = bindCrypto(function (publicJwk) {
  var crypto = this
  var userSecretJwk
  return crypto.createSymmetricKey()
    .then(function (_userSecretJwk) {
      userSecretJwk = _userSecretJwk
      return crypto.encryptAsymmetricWith(publicJwk)(userSecretJwk)
    })
    .then(function (encryptedUserSecret) {
      return {
        encryptedUserSecret: encryptedUserSecret,
        userSecret: userSecretJwk
      }
    })
})

function exchangeUserSecret (api, accountId) {
  return api.getPublicKey(accountId)
    .then(generateNewUserSecret)
    .then(function (result) {
      var body = {
        accountId: accountId,
        encryptedSecret: result.encryptedUserSecret
      }
      return api.postUserSecret(body)
        .then(function () {
          return result.userSecret
        })
    })
}
