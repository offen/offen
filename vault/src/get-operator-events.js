/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')
var ULID = require('ulid')
var startOfHour = require('date-fns/start_of_hour')

var api = require('./api')
var queries = require('./queries')
var storage = require('./storage')
var bindCrypto = require('./bind-crypto')
var decryptEvents = require('./decrypt-events')

module.exports = getOperatorEventsWith(queries, storage, api)
module.exports.getOperatorEventsWith = getOperatorEventsWith

function getOperatorEventsWith (queries, storage, api) {
  return function (query, authenticatedUser) {
    var matchingAccount = _.findWhere(authenticatedUser.accounts, { accountId: query.accountId })
    if (!matchingAccount) {
      return Promise.reject(new Error('No matching key found for account with id ' + query.accountId))
    }
    return ensureSyncWith(storage, api)(query.accountId, matchingAccount.keyEncryptionKey)
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

function ensureSyncWith (storage, api) {
  return bindCrypto(function (accountId, keyEncryptionJWK) {
    var crypto = this
    return storage.getLastKnownCheckpoint(accountId)
      .then(function (checkpoint) {
        var params = checkpoint
          ? { since: checkpoint }
          : null
        return fetchOperatorEventsWith(api)(accountId, params)
          .then(function (payload) {
            return ensureAggregationSecret(payload.account.publicKey)
              .then(function () {
                return Promise.all([
                  payload,
                  crypto.decryptSymmetricWith(keyEncryptionJWK)(payload.account.encryptedPrivateKey)
                ])
              })
          })
          .then(function (results) {
            var payload = results[0]
            var privateJwk = results[1]
            var eventIds = _.pluck(payload.events, 'eventId')
            return Promise
              .all([
                storage.putEvents.apply(
                  null, [accountId].concat(payload.events)
                ),
                storage.putEncryptedSecrets.apply(
                  null, [accountId].concat(payload.encryptedSecrets)
                ),
                payload.account.deletedEvents
                  ? storage.deleteEvents.apply(
                    null, [accountId].concat(payload.account.deletedEvents)
                  )
                  : null,
                payload.account.sequence
                  ? storage.updateLastKnownCheckpoint(accountId, payload.account.sequence)
                  : null
              ])
              .then(function () {
                return updateAggregates(eventIds, payload.account.deletedEvents, privateJwk)
              })
              .then(function () {
                var result = Object.assign(payload.account, {
                  privateJwk: privateJwk
                })
                return result
              })
          })
      })

    function updateAggregates (eventIds, deletedEvents, privateJwk) {
      return Promise.all([
        storage.getEventsByIds(accountId, eventIds),
        storage.getEncryptedSecrets(accountId)
      ])
        .then(function (result) {
          var encryptedEvents = result[0]
          var encryptedSecrets = result[1]
          return decryptEvents(encryptedEvents, encryptedSecrets, privateJwk)
        })
        .then(function (events) {
          return Promise.all(_.chain(events)
            .groupBy(function (event) {
              var time = ULID.decodeTime(event.eventId)
              return startOfHour(new Date(time)).toJSON()
            })
            .pairs()
            .map(function (pair) {
              var timestamp = pair[0]
              var events = pair[1]
              return storage.getAggregate(accountId, timestamp)
                .then(function (existingAggregate) {
                  var aggregate = queries.aggregate(events, queries.normalizeEvent)
                  if (existingAggregate) {
                    aggregate = queries.mergeAggregates([existingAggregate, aggregate])
                  }
                  return storage.putAggregate(accountId, timestamp, aggregate)
                })
            })
            .value())
        })
        .then(function () {
          return Promise.all(_.chain(deletedEvents || [])
            .groupBy(function (eventId) {
              var time = ULID.decodeTime(eventId)
              return startOfHour(new Date(time)).toJSON()
            })
            .pairs()
            .map(function (pair) {
              var timestamp = pair[0]
              var eventIds = pair[1]
              return storage.getAggregate(accountId, timestamp)
                .then(function (aggregate) {
                  if (!aggregate) {
                    return {}
                  }
                  return queries.removeFromAggregate(aggregate, 'eventId', eventIds)
                })
                .then(function (updatedAggregate) {
                  if (!_.size(updatedAggregate)) {
                    return storage.deleteAggregate(accountId, timestamp)
                  }
                  return storage.putAggregate(accountId, timestamp, updatedAggregate)
                })
            })
            .value())
        })
    }

    function ensureAggregationSecret (publicKey, encryptedPrivateKey) {
      return storage.getAggregationSecret(accountId)
        .then(function (secret) {
          if (secret) {
            return secret
          }
          return crypto.createSymmetricKey()
            .then(function (cryptoKey) {
              return crypto.encryptAsymmetricWith(publicKey)(cryptoKey)
            })
            .then(function (encryptedSecret) {
              return storage.putAggregationSecret(accountId, encryptedSecret)
            })
        })
    }
  })
}
