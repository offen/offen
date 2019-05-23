var Dexie = require('dexie')

module.exports = getDatabase

// getDatabase returns a `dexie` instance that is configured with the expected
// databases and schemas. When called multiple times, it will always return the
// same instance.
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
