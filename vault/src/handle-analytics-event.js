var relayEvent = require('./relay-event')

module.exports = handleAnalyticsEvent

// handleAnalyticsEvent relays the incoming message to a server.
// It is **important** that this handler does **not** call the passed
// response function as this would try responding to untrusted domains and
// raise an error.
function handleAnalyticsEvent (message, respond) {
  var accountId = message.payload.accountId
  return relayEvent(accountId, message.payload.event)
}
