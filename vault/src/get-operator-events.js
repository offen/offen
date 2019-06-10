var crypto = require('./crypto')
var api = require('./api')

module.exports = getOperatorEvents

function getOperatorEvents (query) {
  var accountId = query.account_id
  var account

  return api.getAccount(accountId)
    .then(function (_account) {
      account = _account
      return api.decryptPrivateKey(account.encrypted_private_key)
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
