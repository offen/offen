var assert = require('assert')

var getDatabase = require('./database')

describe('src/database.js', function () {
  describe('getDatabase()', function () {
    it('returns an instance of `Dexie`', function () {
      var Dexie = require('dexie')
      var db = getDatabase()
      assert(db instanceof Dexie)
    })

    it('exposes a `secrets` database', function () {
      var db = getDatabase()
      assert(db.secrets)
    })

    it('returns the same instance on subsequent calls', function () {
      var db1 = getDatabase()
      var db2 = getDatabase()
      assert.strictEqual(db1, db2)
    })
  })
})
