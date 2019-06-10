var relayEvent = require('./relay-event')

module.exports = handleAnalyticsEvent

function handleAnalyticsEvent (message, respond) {
  var accountId = message.payload.accountId
  return relayEvent(accountId, message.payload.event)
}
