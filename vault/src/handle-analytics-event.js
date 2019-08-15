var relayEvent = require('./relay-event')

module.exports = handleAnalyticsEvent

// handleAnalyticsEvent relays the incoming message to a server.
function handleAnalyticsEvent (message) {
  var accountId = message.payload.accountId
  return relayEvent(accountId, message.payload.event, false)
}
