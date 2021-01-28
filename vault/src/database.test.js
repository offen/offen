/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const getDatabase = require('./database')

describe('src/database.js', function () {
  describe('getDatabase()', function () {
    it('returns an instance of `Dexie`', function () {
      const Dexie = require('dexie')
      const db = getDatabase()
      assert(db instanceof Dexie)
    })

    it('exposes a `keys` and a `events` table', function () {
      const db = getDatabase()
      assert(db.keys)
      assert(db.events)
    })

    it('returns the same instance on subsequent calls', function () {
      const db1 = getDatabase()
      const db2 = getDatabase()
      assert.strictEqual(db1, db2)
    })
  })
})
