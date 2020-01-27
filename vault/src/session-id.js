var uuid = require('uuid/v4')

module.exports = getSessionId

function getSessionId (accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  var sessionId
  try {
    var lookupKey = 'session-' + accountId
    var matches = document.cookie.split(';')
      .map(function (chunk) {
        return chunk.trim().split('=')
      })
      .filter(function (pair) {
        return pair[0] === lookupKey
      })
      .map(function (pair) {
        return pair[1]
      })
    sessionId = matches.length
      ? matches[0]
      : null

    if (!sessionId) {
      sessionId = uuid()
      document.cookie = [lookupKey, sessionId].join('=') + '; SameSite=Lax'
    }
  } catch (err) {
    sessionId = uuid()
  }
  return sessionId
}
