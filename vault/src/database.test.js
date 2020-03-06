/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var getDatabase = require('./database')

describe('src/database.js', function () {
  describe('getDatabase()', function () {
    it('returns an instance of `Dexie`', function () {
      var Dexie = require('dexie')
      var db = getDatabase()
      assert(db instanceof Dexie)
    })

    it('exposes a `keys` and a `events` table', function () {
      var db = getDatabase()
      assert(db.keys)
      assert(db.events)
    })

    it('returns the same instance on subsequent calls', function () {
      var db1 = getDatabase()
      var db2 = getDatabase()
      assert.strictEqual(db1, db2)
    })
  })
})
