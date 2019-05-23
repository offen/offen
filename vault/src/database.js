var Dexie = require('dexie')

module.exports = getDatabase

function getDatabase () {
  getDatabase.db = getDatabase.db || createDatabase()
  return getDatabase.db
}

function createDatabase () {
  var db = new Dexie('user_secrets')
  db.version(1).stores({
    secrets: 'accountId'
  })
  return db
}
