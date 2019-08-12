var relayEvent = require('./relay-event')

module.exports = handleAnalyticsEvent

// handleAnalyticsEvent relays the incoming message to a server.
// It is **important** that this handler does return null on success and error
// as otherwise this would try responding to untrusted domains and
// raise an error.
function handleAnalyticsEvent (message) {
  var accountId = message.payload.accountId
  return relayEvent(accountId, message.payload.event, false)
    .then(function () {
      return null
    })
    .catch(function (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(err)
      }
      return null
    })
}
