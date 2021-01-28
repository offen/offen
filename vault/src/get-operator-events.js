/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('underscore')

const api = require('./api')
const queries = require('./queries')
const storage = require('./aggregating-storage')
const bindCrypto = require('./bind-crypto')

module.exports = getOperatorEventsWith(queries, storage, api)
module.exports.getOperatorEventsWith = getOperatorEventsWith

function getOperatorEventsWith (queries, eventStore, api) {
  return function (query, authenticatedUser) {
    const matchingAccount = _.findWhere(authenticatedUser.accounts, { accountId: query.accountId })
    if (!matchingAccount) {
      return Promise.reject(
        new Error('No matching key found for account with id ' + query.accountId)
      )
    }
    return ensureSyncWith(eventStore, api)(query.accountId, matchingAccount.keyEncryptionKey)
      .then(function (account) {
        return queries.getDefaultStats(
          query.accountId, query, account.publicKey, account.privateKey
        )
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
        const returnedSecrets = Object.keys(account.secrets || {})
          .map(function (secretId) {
            return [secretId, account.secrets[secretId]]
          })
          .filter(function (pair) {
            return pair[1]
          })
        const returnedEvents = _.flatten(Object.values(account.events || {}), true)
        return {
          events: returnedEvents,
          encryptedSecrets: returnedSecrets,
          account: account
        }
      })
  }
}

function ensureSyncWith (eventStore, api) {
  return bindCrypto(function (accountId, keyEncryptionJwk) {
    const decryptKey = this.decryptSymmetricWith(keyEncryptionJwk)
    return eventStore.getLastKnownCheckpoint(accountId)
      .then(function (checkpoint) {
        const params = checkpoint
          ? { since: checkpoint }
          : null

        return fetchOperatorEventsWith(api)(accountId, params)
          .then(function (payload) {
            return Promise.all([
              decryptKey(payload.account.encryptedPrivateKey),
              eventStore.putEvents(accountId, payload.events),
              payload.account.sequence
                ? eventStore.updateLastKnownCheckpoint(accountId, payload.account.sequence)
                : null,
              eventStore.putEncryptedSecrets(accountId, payload.encryptedSecrets),
              payload.account.deletedEvents
                ? eventStore.deleteEvents(accountId, payload.account.deletedEvents)
                : null
            ])
              .then(function (results) {
                const privateKey = results[0]
                const result = Object.assign(payload.account, {
                  privateKey: privateKey
                })
                return result
              })
          })
      })
  })
}
