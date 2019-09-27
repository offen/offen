module.exports = router

function router () {
  var registeredRoutes = {}
  var registeredMiddleware = []
  window.addEventListener('message', function (event) {
    function respond (message) {
      if (event.ports && event.ports.length) {
        event.ports[0].postMessage(message)
      }
    }

    var stack = (registeredRoutes[event.data.type] || []).slice()

    function callNext () {
      function next (err) {
        if (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(err)
          }
          respond({
            type: 'ERROR',
            payload: {
              error: err.message,
              stack: err.stack
            }
          })
        } else {
          callNext()
        }
      }
      var nextHandler = stack.shift() || function (event, respond, next) {
        next(new Error('Message of type "' + event.data.type + '" was not handled.'))
      }
      nextHandler(event, respond, next)
    }

    callNext()
  })

  return {
    on: function (messageType /* , ...handlerFns */) {
      var handlerFns = [].slice.call(arguments, 1)
      registeredRoutes[messageType] = registeredMiddleware.slice().concat(handlerFns)
    },
    use: function (/* ...handlerFns */) {
      registeredMiddleware = registeredMiddleware.concat([].slice.call(arguments))
    }
  }
}
