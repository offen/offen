var relayEvent = require('./relay-event')

module.exports = handleAnonymousEvent

// handleAnonymousEvent relays the incoming message to a server.
function handleAnonymousEvent (message) {
  var accountId = message.payload.accountId
  return relayEvent(accountId, message.payload.event, true)
}
