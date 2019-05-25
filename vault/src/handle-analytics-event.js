var postEvent = require('./post-event')

module.exports = handleAnalyticsEvent

function handleAnalyticsEvent (message, respond) {
  var accountId = message.payload.accountId
  return postEvent(accountId, message.payload.event)
}
