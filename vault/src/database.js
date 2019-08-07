var Dexie = require('dexie')

module.exports = getDatabase

// getDatabase returns a `Dexie` instance that is configured with the expected
// databases and schemas. When called multiple times, it will always return the
// same instance.
function getDatabase (name) {
  name = name || 'user'
  getDatabase[name] = getDatabase[name] || createDatabase(name)
  return getDatabase[name]
}

function createDatabase (name) {
  var db = new Dexie(name)

  db.version(1).stores({
    secrets: 'accountId'
  })

  var eventsSchemaV2 = [
    'eventId',
    'accountId',
    'userId',
    'payload.timestamp',
    'payload.sessionId',
    '[accountId+payload.href]'
  ].join(',')

  db.version(2).stores({
    secrets: 'accountId',
    events: eventsSchemaV2
  })

  var eventsSchemaV3 = [
    'eventId',
    'payload.timestamp',
    '[payload.timestamp+accountId]',
    '[payload.timestamp+userId]',
    '[payload.timestamp+payload.sessionId]',
    '[payload.timestamp+accountId+payload.href]'
  ].join(',')

  db.version(3).stores({
    secrets: 'accountId',
    events: eventsSchemaV3
  }).upgrade(function (t) {
    // This migration moves each user secret to a database of the same
    // name, effectively deprecating the `user_secrets` database.
    // User events will now be stored in a dedicated `user` database.
    // `user_secrets` is deleted on success.
    if (t.db.name === 'user_secrets') {
      return t.secrets.toArray(function (secrets) {
        var move = Promise.all(
          secrets.map(function (secret) {
            return getDatabase(secret.accountId).secrets.put(secret)
          })
        )
        return Dexie.waitFor(move)
          .then(function () {
            return t.db.delete()
          })
      })
    }
    return Dexie.waitFor(Promise.resolve())
  })

  db.version(4).stores({
    secrets: null, // this deletes previously defined tables
    keys: 'type,[type+userId]',
    events: 'eventId,[eventId+accountId],[eventId+userId]'
  }).upgrade(function (t) {
    return t.events.clear()
  })

  return db
}
