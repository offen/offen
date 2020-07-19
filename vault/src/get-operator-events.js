/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var api = require('./api')
var queries = require('./queries')
var bindCrypto = require('./bind-crypto')

module.exports = getOperatorEventsWith(queries, api)
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
        var returnedSecrets = Object.keys(account.secrets || {})
          .map(function (secretId) {
            return [secretId, account.secrets[secretId]]
          })
          .filter(function (pair) {
            return pair[1]
          })
        var returnedEvents = _.flatten(Object.values(account.events || {}), true)
        return {
          events: returnedEvents,
          encryptedSecrets: returnedSecrets,
          account: account
        }
      })
  }
}

function ensureSyncWith (queries, api) {
  return bindCrypto(function (accountId, keyEncryptionJWK) {
    var crypto = this
    return queries.getLastKnownCheckpoint(accountId)
      .then(function (checkpoint) {
        var params = checkpoint
          ? { since: checkpoint }
          : null
        return fetchOperatorEventsWith(api, queries)(accountId, params)
          .then(function (payload) {
            var encryptedPrivateKey = payload.account.encryptedPrivateKey
            return Promise
              .all([
                crypto.decryptSymmetricWith(keyEncryptionJWK)(encryptedPrivateKey),
                queries.putEvents.apply(
                  null, [accountId].concat(payload.events)
                ),
                queries.putEncryptedSecrets.apply(
                  null, [accountId].concat(payload.encryptedSecrets)
                ),
                payload.account.deletedEvents
                  ? queries.deleteEvents.apply(
                    null, [accountId].concat(payload.account.deletedEvents)
                  )
                  : null,
                payload.account.sequence
                  ? queries.updateLastKnownCheckpoint(accountId, payload.account.sequence)
                  : null
              ])
              .then(function (results) {
                var privateJwk = results[0]
                var result = Object.assign(payload.account, {
                  privateJwk: privateJwk
                })
                return result
              })
          })
      })
  })
}
