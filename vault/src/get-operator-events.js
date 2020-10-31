/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var api = require('./api')
var queries = require('./queries')
var storage = require('./aggregating-storage')
var bindCrypto = require('./bind-crypto')

module.exports = getOperatorEventsWith(queries, storage, api)
module.exports.getOperatorEventsWith = getOperatorEventsWith

function getOperatorEventsWith (queries, eventStore, api) {
  return function (query, authenticatedUser) {
    var matchingAccount = _.findWhere(authenticatedUser.accounts, { accountId: query.accountId })
    if (!matchingAccount) {
      return Promise.reject(new Error('No matching key found for account with id ' + query.accountId))
    }
    return ensureSyncWith(eventStore, api)(query.accountId, matchingAccount.keyEncryptionKey)
      .then(function (account) {
        return queries.getDefaultStats(query.accountId, query, account.privateJwk)
          .then(function (stats) {
            return Object.assign(stats, { account: account })
          })
      })
  }
}

function fetchOperatorEventsWith (api) {
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

function ensureSyncWith (eventStore, api) {
  return bindCrypto(function (accountId, keyEncryptionJWK) {
    var crypto = this
    var payload
    var privateJwk
    return eventStore.getLastKnownCheckpoint(accountId)
      .then(function (checkpoint) {
        var params = checkpoint
          ? { since: checkpoint }
          : null
        return fetchOperatorEventsWith(api)(accountId, params)
          .then(function (_payload) {
            payload = _payload
            return Promise.all([
              crypto.decryptSymmetricWith(keyEncryptionJWK)(payload.account.encryptedPrivateKey),
              payload.account.sequence
                ? eventStore.updateLastKnownCheckpoint(accountId, payload.account.sequence)
                : null
            ])
          })
          .then(function (results) {
            privateJwk = results[0]
            return Promise.all([
              eventStore.putEncryptedSecrets(accountId, payload.encryptedSecrets),
              eventStore.ensureAggregationSecret(accountId, payload.account.publicKey, privateJwk)
            ])
          })
          .then(function () {
            return eventStore.putEvents(accountId, payload.events, privateJwk)
          })
          .then(function () {
            return payload.account.deletedEvents
              ? eventStore.deleteEvents(accountId, payload.account.deletedEvents)
              : null
          })
          .then(function () {
            var result = Object.assign(payload.account, {
              privateJwk: privateJwk
            })
            return result
          })
      })
  })
}
