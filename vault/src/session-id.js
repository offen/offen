/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var uuid = require('uuid/v4')

var cookies = require('./cookie-tools')

module.exports = getSessionId

function getSessionId (accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  var sessionId
  try {
    var lookupKey = 'session-' + accountId
    var cookieData = cookies.parse(document.cookie)
    sessionId = cookieData[lookupKey] || null
    if (!sessionId) {
      sessionId = uuid()
      var cookie = cookies.defaultCookie(lookupKey, sessionId)
      document.cookie = cookies.serialize(cookie)
    }
  } catch (err) {
    sessionId = uuid()
  }
  return sessionId
}
