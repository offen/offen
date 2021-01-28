/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const uuid = require('uuid/v4')

const cookies = require('./cookie-tools')

module.exports = getSessionId

function getSessionId (accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  let sessionId
  try {
    const lookupKey = 'session-' + accountId
    const cookieData = cookies.parse(document.cookie)
    sessionId = cookieData[lookupKey] || null
    if (!sessionId) {
      sessionId = uuid()
      const cookie = cookies.defaultCookie(lookupKey, sessionId)
      document.cookie = cookies.serialize(cookie)
    }
  } catch (err) {
    sessionId = uuid()
  }
  return sessionId
}
