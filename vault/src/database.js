/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

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
    keys: '++,type',
    events: 'eventId'
  })

  return db
}
