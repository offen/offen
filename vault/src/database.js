var Dexie = require('dexie')

module.exports = getDatabase

// getDatabase returns a `dexie` instance that is configured with the expected
// databases and schemas. When called multiple times, it will always return the
// same instance.
function getDatabase (name) {
  name = name || 'user_secrets'
  getDatabase[name] = getDatabase[name] || createDatabase(name)
  return getDatabase[name]
}

function createDatabase (name) {
  var db = new Dexie(name)
  db.version(1).stores({
    secrets: 'accountId'
  })

  var eventsSchema = [
    'eventId',
    'accountId',
    'userId',
    'payload.timestamp',
    'payload.sessionId',
    '[accountId+payload.href]'
  ].join(',')

  db.version(2).stores({
    secrets: 'accountId',
    events: eventsSchema
  })
  return db
}
