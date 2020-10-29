/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var dexie = require('dexie')
var addHours = require('date-fns/add_hours')

var getDatabase = require('./database')
var cookies = require('./cookie-tools')

var fallbackStore = { events: {}, keys: {}, checkpoints: {}, aggregates: {} }

var TYPE_LAST_KNOWN_CHECKPOINT = 'LAST_KNOWN_CHECKPOINT'
var TYPE_USER_SECRET = 'USER_SECRET'
var TYPE_ENCRYPTED_SECRET = 'ENCRYPTED_SECRET'
var TYPE_ENCRYPTED_AGGREGATION_SECRET = 'ENCRYPTED_AGGREGATION_SECRET'

module.exports = new Storage(getDatabase, fallbackStore)
module.exports.Storage = Storage

function Storage (getDatabase, fallbackStore) {
  this.updateLastKnownCheckpoint = function (accountId, sequence) {
    var table = getDatabase(accountId).checkpoints
    return table.put({
      type: TYPE_LAST_KNOWN_CHECKPOINT,
      sequence: sequence
    })
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.checkpoints[accountId] = sequence
      })
  }

  this.getLastKnownCheckpoint = function (accountId) {
    var table = getDatabase(accountId).checkpoints
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

  this.getAllEvents = function (accountId, lowerBound, upperBound) {
    var table = getDatabase(accountId).events
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
    var table = getDatabase(accountId).events
    return table
      .where('eventId')
      .anyOf(eventIds)
      .toArray()
  }

  this.countEvents = function (accountId) {
    var table = getDatabase(accountId).events
    return table.count()
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        return fallbackStore.events[accountId].length
      })
  }

  this.getAggregationSecret = function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .get({ type: TYPE_ENCRYPTED_AGGREGATION_SECRET })
      .then(function (result) {
        if (result) {
          return result.value
        }
      })
      .catch(dexie.OpenFailedError, function () {
        return null
      })
  }

  this.putAggregationSecret = function (accountId, aggregationSecret) {
    var db = getDatabase(accountId)
    return db.keys
      .put({
        type: TYPE_ENCRYPTED_AGGREGATION_SECRET,
        value: aggregationSecret
      })
      .catch(dexie.OpenFailedError, function () {
        return null
      })
  }

  this.putAggregate = function (accountId, timestamp, aggregate) {
    return getDatabase(accountId)
      .aggregates
      .put({
        timestamp: timestamp,
        value: aggregate
      })
      .catch(dexie.OpenFailedError, function () {
        return null
      })
  }

  this.getAggregate = function (accountId, timestamp) {
    return getDatabase(accountId)
      .aggregates
      .get(timestamp)
      .then(function (result) {
        if (result) {
          return result.value
        }
      })
  }

  this.deleteAggregate = function (accountId, timestamp) {
    return getDatabase(accountId)
      .aggregates
      .delete(timestamp)
  }

  this.getAggregates = function (accountId, lowerBound, upperBound) {
    var table = getDatabase(accountId).aggregates
    if (!lowerBound || !upperBound) {
      return table.toArray()
    }
    return table
      .where('timestamp')
      .between(lowerBound, upperBound)
      .toArray()
  }

  this.getUserSecret = function (accountId) {
    var db = getDatabase(accountId)
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
        var cookieData = cookies.parse(document.cookie)
        var lookupKey = TYPE_USER_SECRET + '-' + accountId
        if (cookieData[lookupKey]) {
          return JSON.parse(cookieData[lookupKey])
        }
        return null
      })
  }

  this.putUserSecret = function (accountId, userSecret) {
    var db = getDatabase(accountId)
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
        var isLocalhost = window.location.hostname === 'localhost'
        var sameSite = isLocalhost ? 'Lax' : 'None'

        var entry = {}
        entry[TYPE_USER_SECRET + '-' + accountId] = JSON.stringify(userSecret)
        Object.assign(entry, {
          Path: '/vault',
          SameSite: sameSite,
          Secure: !isLocalhost,
          expires: addHours(new Date(), 4464).toUTCString()
        })
        document.cookie = cookies.serialize(entry)
      })
  }

  this.deleteUserSecret = function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .where({ type: TYPE_USER_SECRET })
      .delete()
      .catch(dexie.OpenFailedError, function () {
        var entry = {}
        entry[TYPE_USER_SECRET + '-' + accountId] = ''
        Object.assign(entry, {
          expires: new Date(0).toUTCString()
        })
        document.cookie = cookies.serialize(entry)
      })
  }

  // user secrets are expected to be passed in [secretUd, secret] tuples
  this.putEncryptedSecrets = function (/* accountId, ...userSecrets */) {
    var args = [].slice.call(arguments)
    var accountId = args.shift()

    var db = getDatabase(accountId)
    var records
    var newKeys = args.map(function (pair) {
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
        fallbackStore.keys[accountId] = fallbackStore.keys[accountId] || []
        fallbackStore.keys[accountId] = fallbackStore.keys[accountId].concat(records)
        return records
      })
  }

  this.putEvents = function (accountId, events) {
    var db = getDatabase(accountId)
    // events data is saved in the shape supplied by the server
    return db.events.bulkPut(events)
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events[accountId] = fallbackStore.events[accountId] || []
        fallbackStore.events[accountId] = fallbackStore.events[accountId].concat(events)
        return fallbackStore.events[accountId]
      })
  }

  this.deleteEvents = function (accountId, eventIds) {
    var db = getDatabase(accountId)
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
    var db = getDatabase(null)
    return Promise.all([
      db.events.clear(),
      db.checkpoints.clear()
    ])
      .catch(dexie.OpenFailedError, function () {
        fallbackStore.events = {}
        fallbackStore.checkpoints = {}
        return null
      })
  }

  this.getEncryptedSecrets = function (accountId) {
    var db = getDatabase(accountId)
    return db.keys
      .where('type')
      .equals(TYPE_ENCRYPTED_SECRET)
      .toArray()
      .catch(dexie.OpenFailedError, function () {
        return fallbackStore.keys[accountId] || []
      })
  }
}
