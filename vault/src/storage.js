/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const dexie = require('dexie')
const addHours = require('date-fns/add_hours')

const getDatabase = require('./database')
const cookies = require('./cookie-tools')

const fallbackStore = { events: {}, encryptedSecrets: {}, checkpoints: {}, aggregates: {}, aggregationSecrets: {} }

const TYPE_LAST_KNOWN_CHECKPOINT = 'LAST_KNOWN_CHECKPOINT'
const TYPE_USER_SECRET = 'USER_SECRET'
const TYPE_ENCRYPTED_SECRET = 'ENCRYPTED_SECRET'
const TYPE_ENCRYPTED_AGGREGATION_SECRET = 'ENCRYPTED_AGGREGATION_SECRET'

module.exports = new Storage(getDatabase, fallbackStore)
module.exports.Storage = Storage

function Storage (getDatabase, fallbackStore) {
  this.updateLastKnownCheckpoint = function (accountId, sequence) {
    const table = getDatabase(accountId).checkpoints
    return table.put({
      type: TYPE_LAST_KNOWN_CHECKPOINT,
      sequence: sequence
    })
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.checkpoints[accountId] = sequence
      })
  }

  this.getLastKnownCheckpoint = function (accountId) {
    const table = getDatabase(accountId).checkpoints
    return table.get({ type: TYPE_LAST_KNOWN_CHECKPOINT })
      .then(function (result) {
        if (!result) {
          return null
        }
        return result.sequence
      })
      .catch(dexie.OpenFailedError, function () {
        return fallbackStore.checkpoints[accountId] || null
      })
  }

  this.getRawEvents = function (accountId, lowerBound, upperBound) {
    const table = getDatabase(accountId).events
    if (!lowerBound || !upperBound) {
      return table
        .toArray()
        .catch(dexie.OpenFailedError, function () {
          fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
          return fallbackStore.events[accountId]
        })
    }
    return table
      .where('eventId')
      .between(lowerBound, upperBound, false, false)
      .toArray()
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        return fallbackStore.events[accountId].filter(function (event) {
          return event.eventId >= lowerBound && event.eventId <= upperBound
        })
      })
  }

  this.getEventsByIds = function (accountId, eventIds) {
    const table = getDatabase(accountId).events
    return table
      .where('eventId')
      .anyOf(eventIds)
      .toArray()
  }

  this.countEvents = function (accountId) {
    const table = getDatabase(accountId).events
    return table.count()
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        return fallbackStore.events[accountId].length
      })
  }

  this.getAggregationSecret = function (accountId) {
    const db = getDatabase(accountId)
    return db.keys
      .get({ type: TYPE_ENCRYPTED_AGGREGATION_SECRET })
      .then(function (result) {
        if (result) {
          return result.value
        }
      })
      .catch(dexie.OpenFailedError, function () {
        return fallbackStore.aggregationSecrets[accountId]
      })
  }

  this.putAggregationSecret = function (accountId, aggregationSecret) {
    const db = getDatabase(accountId)
    return db.keys
      .put({
        type: TYPE_ENCRYPTED_AGGREGATION_SECRET,
        value: aggregationSecret
      })
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.aggregationSecrets[accountId] = aggregationSecret
        return null
      })
  }

  this.putAggregate = function (accountId, timestamp, aggregate, compressed) {
    return getDatabase(accountId)
      .aggregates
      .put({
        timestamp: timestamp,
        value: aggregate,
        compressed: compressed
      })
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.aggregates[accountId] = fallbackStore.aggregates[accountId] || {}
        return fallbackStore.aggregates[accountId][timestamp]
      })
  }

  this.getAggregate = function (accountId, timestamp) {
    return getDatabase(accountId)
      .aggregates
      .get(timestamp)
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.aggregates[accountId] = fallbackStore.aggregates[accountId] || {}
        return fallbackStore.aggregates[accountId][timestamp]
      })
  }

  this.purgeAggregates = function (accountId) {
    return getDatabase(accountId)
      .aggregates
      .clear()
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.aggregates[accountId] = {}
      })
  }

  this.deleteAggregate = function (accountId, timestamp) {
    return getDatabase(accountId)
      .aggregates
      .delete(timestamp)
      .catch(function () {
        fallbackStore.aggregates[accountId] = fallbackStore.aggregates[accountId] || {}
        delete fallbackStore.aggregates[accountId][timestamp]
      })
  }

  this.getAggregates = function (accountId, lowerBound, upperBound) {
    const table = getDatabase(accountId).aggregates
    if (!lowerBound || !upperBound) {
      return table.toArray()
        .catch(dexie.OpenFailedError, function () {
          fallbackStore.aggregates[accountId] = fallbackStore.aggregates[accountId] || {}
          return fallbackStore.aggregates[accountId]
        })
    }
    return table
      .where('timestamp')
      .between(lowerBound, upperBound)
      .toArray()
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.aggregates[accountId] = fallbackStore.aggregates[accountId] || {}
        const result = {}
        Object.keys(fallbackStore.aggregates[accountId]).forEach(function (timestamp) {
          if ((!lowerBound || lowerBound <= timestamp) && (timestamp <= upperBound || !upperBound)) {
            result[timestamp] = fallbackStore.aggregates[accountId][timestamp]
          }
        })
        return result
      })
  }

  this.getUserSecret = function (accountId) {
    const db = getDatabase(accountId)
    return db.keys
      .get({ type: TYPE_USER_SECRET })
      .then(function (result) {
        if (result) {
          return result.value
        }
        // This is a nifty hack to work around the following situation:
        // When run in a non-Auditorium context, Safari throws an OpenFailedError
        // when trying to access IndexedDB which is we we need to fall back to
        // cookie based persistence for user secrets.
        // When run in the context of the Auditorium, Safari allows IndexedDB
        // to be accessed, but the lookup will not yield any result. This means
        // we throw this error to make another lookup attempt before returning
        // null.
        throw new dexie.OpenFailedError('Trying to fall back to cookie based persistence.')
      })
      .catch(dexie.OpenFailedError, function () {
        const cookieData = cookies.parse(document.cookie)
        const lookupKey = TYPE_USER_SECRET + '-' + accountId
        if (cookieData[lookupKey]) {
          return JSON.parse(cookieData[lookupKey])
        }
        return null
      })
  }

  this.putUserSecret = function (accountId, userSecret) {
    const db = getDatabase(accountId)
    return db.keys
      .where({ type: TYPE_USER_SECRET })
      .first()
      .then(function (existingSecret) {
        if (existingSecret) {
          return
        }
        return db.keys
          .put({
            type: TYPE_USER_SECRET,
            value: userSecret
          })
      })
      .catch(dexie.OpenFailedError, function () {
        const key = TYPE_USER_SECRET + '-' + accountId
        const value = JSON.stringify(userSecret)
        const cookie = cookies.defaultCookie(key, value, {
          expires: addHours(new Date(), 4464),
          path: '/vault'
        })
        document.cookie = cookies.serialize(cookie)
      })
  }

  this.deleteUserSecret = function (accountId) {
    const db = getDatabase(accountId)
    return db.keys
      .where({ type: TYPE_USER_SECRET })
      .delete()
      .catch(dexie.OpenFailedError, function () {
        const key = TYPE_USER_SECRET + '-' + accountId
        const cookie = cookies.defaultCookie(key, '', {
          expires: new Date(0)
        })
        document.cookie = cookies.serialize(cookie)
      })
  }

  this.putEvents = function (accountId, events) {
    const db = getDatabase(accountId)
    // events data is saved in the shape supplied by the server
    return db.events.bulkPut(events)
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        fallbackStore.events[accountId] = fallbackStore.events[accountId].concat(events)
        return fallbackStore.events[accountId]
      })
  }

  this.deleteEvents = function (accountId, eventIds) {
    const db = getDatabase(accountId)
    return db.events.bulkDelete(eventIds)
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        fallbackStore.events[accountId] = fallbackStore.events[accountId].filter(function (event) {
          return eventIds.indexOf(event.eventId) === -1
        })
        return null
      })
  }

  this.purge = function () {
    const db = getDatabase(null)
    return Promise.all([
      db.events.clear(),
      db.checkpoints.clear()
    ])
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events = {}
        fallbackStore.checkpoints = {}
        fallbackStore.aggregates = {}
        return null
      })
  }

  // user secrets are expected to be passed in [secretId, secret] tuples
  this.putEncryptedSecrets = function (accountId, userSecrets) {
    const db = getDatabase(accountId)
    let records
    const newKeys = userSecrets.map(function (pair) {
      return {
        type: TYPE_ENCRYPTED_SECRET,
        secretId: pair[0],
        value: pair[1]
      }
    })
    return db.keys.toArray()
      .then(function (knownKeys) {
        return newKeys.filter(function (newKey) {
          return knownKeys.every(function (knownKey) {
            return knownKey.secretId !== newKey.secretId
          })
        })
      })
      .then(function (_records) {
        records = _records
        return db.keys.bulkPut(records)
      })
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.encryptedSecrets[accountId] = fallbackStore.encryptedSecrets[accountId] || []
        fallbackStore.encryptedSecrets[accountId] = fallbackStore.encryptedSecrets[accountId].concat(newKeys)
        return records
      })
  }

  this.getEncryptedSecrets = function (accountId) {
    const db = getDatabase(accountId)
    return db.keys
      .where('type')
      .equals(TYPE_ENCRYPTED_SECRET)
      .toArray()
      .catch(dexie.OpenFailedError, function () {
        return fallbackStore.encryptedSecrets[accountId] || []
      })
  }
}
