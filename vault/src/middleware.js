var allowsCookies = require('./allows-cookies')
var consentStatus = require('./user-consent')
var getSessionId = require('./session-id')

exports.optIn = optIn

function optIn (event, respond, next) {
  Promise.resolve(consentStatus.get())
    .then(function (status) {
      if (status) {
        return status
      }
      function styleHost (payload) {
        return respond({
          type: 'STYLES',
          payload: payload
        })
      }
      styleHost.selector = respond.selector
      return consentStatus.askForConsent(styleHost)
    })
    .then(function (status) {
      consentStatus.set(status)
      if (status === consentStatus.ALLOW) {
        return next()
      }
      console.log(__('This page is using offen to collect usage statistics.'))
      console.log(__('You have opted out of data collection, no data is being collected.'))
      console.log(__('Find out more about offen at "%s"', window.location.origin))
    })
}

exports.eventDuplexer = eventDuplexer

function eventDuplexer (event, respond, next) {
  // eventDuplexerMiddleware adds properties to an event that could be subject to spoofing
  // or unwanted access by 3rd parties in "script". For example adding the session id
  // here instead of the script prevents other scripts from reading this value.
  var now = new Date()
  if (!allowsCookies()) {
    event.data.anoynmous = true
    event.data.payload.event = {
      timestamp: now,
      type: event.data.payload.event.type
    }
    return next()
  }
  Object.assign(event.data.payload.event, {
    timestamp: now,
    sessionId: getSessionId(event.data.payload.accountId)
  })
  next()
}

exports.sameOrigin = sameOrigin

function sameOrigin (event, respond, next) {
  if (event.origin !== window.location.origin) {
    return next(new Error('Incoming message had untrusted origin "' + event.origin + '", will not process.'))
  }
  next()
}
