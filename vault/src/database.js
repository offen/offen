/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const Dexie = require('dexie')

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
  const db = new Dexie(name)

  // Version 3 adds an `aggregates` table without any further changes.
  db.version(3).stores({
    keys: '++,type',
    events: 'eventId',
    checkpoints: 'type',
    aggregates: 'timestamp'
  })

  // Version 2 removes the timestamp index from the events table as it's not
  // needed anymore. Clients will resync from scratch after this migration.
  db.version(2).stores({
    keys: '++,type',
    events: 'eventId',
    checkpoints: 'type'
  }).upgrade(function (txn) {
    return txn.table('events').clear()
  })

  db.version(1).stores({
    keys: '++,type',
    events: 'eventId,timestamp'
  })

  return db
}
