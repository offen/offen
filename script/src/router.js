var vault = require('offen/vault')

module.exports = router

function router (vaultUrl) {
  function send (message) {
    return vault(vaultUrl)
      .then(function (postMessage) {
        return new Promise(function (resolve) {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(function () {
              resolve(postMessage(message))
            })
          } else {
            resolve(postMessage(message))
          }
        })
      })
  }

  var registeredEvents = {}

  var channel = new window.MessageChannel()
  channel.port2.onmessage = function (event) {
    // clone the message so it can be mutated while
    // being passed through the middleware stack
    var message = Object.assign({}, event.data)

    var stack = (registeredEvents[message.type] || []).slice()
    function callNext () {
      function next (err) {
        if (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(err)
          }
          return
        }
        callNext()
      }

      var nextHandler = stack.shift() || function (message, send, next) {
        next(new Error('Event of type "' + event.data.type + '" not handled.'))
      }
      nextHandler(message, send, next)
    }

    callNext()
  }

  return {
    on: function (eventType/* , ...stack */) {
      var stack = [].slice.call(arguments, 1)
      registeredEvents[eventType] = stack
    },
    dispatch: function (eventType, message) {
      channel.port1.postMessage({
        type: eventType,
        payload: message
      })
    }
  }
}
