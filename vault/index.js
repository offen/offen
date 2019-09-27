var handler = require('./src/handler')
var allowsCookies = require('./src/allows-cookies')
var hasOptedOut = require('./src/user-optout')

var app = vault()

app.route('EVENT', optOutMiddleware, anonymousMiddleware, function (event, respond, next) {
  console.log('This page is using offen to collect usage statistics.')
  console.log('You can access and manage all of your personal data or opt-out at "' + window.location.origin + '/auditorium/".')
  console.log('Find out more about offen at "https://www.offen.dev".')
  handler.handleAnalyticsEvent(event.data)
    .then(Function.prototype, next)
})

app.use(sameOriginMiddleware)

app.route('QUERY', function (event, respond, next) {
  handler.handleQuery(event.data)
    .then(respond, next)
})

app.route('PURGE', function (event, respond, next) {
  handler.handlePurge(event.data)
    .then(respond, next)
})

app.route('OPTOUT', function (event, respond, next) {
  handler.handleOptout(event.data)
    .then(respond, next)
})

app.route('OPTOUT_STATUS', function (event, respond, next) {
  var data = handler.handleOptoutStatus(event.data)
  respond(data)
})

app.route('LOGIN', function (event, respond, next) {
  handler.handleLogin(event.data)
    .then(respond, next)
})

app.route('CHANGE_CREDENTIALS', function (event, respond, next) {
  handler.handleChangeCredentials(event.data)
    .then(respond, next)
})

app.route('FORGOT_PASSWORD', function (event, respond, next) {
  handler.handleForgotPassword(event.data)
    .then(respond, next)
})

app.route('RESET_PASSWORD', function (event, respond, next) {
  handler.handleResetPassword(event.data)
    .then(respond, next)
})

function sameOriginMiddleware (event, respond, next) {
  if (event.origin !== window.location.origin) {
    return next(new Error('Incoming message had untrusted origin "' + event.origin + '", will not process.'))
  }
  next()
}

function optOutMiddleware (event, respond, next) {
  if (!hasOptedOut()) {
    return next()
  }
  console.log('This page is using offen to collect usage statistics.')
  console.log('You have opted out of data collection, no data is being collected.')
  console.log('Find out more about offen at "https://www.offen.dev".')
}

function anonymousMiddleware (event, respond, next) {
  if (allowsCookies()) {
    return next()
  }
  console.log('This page is using offen to collect usage statistics.')
  console.log('Your setup prevents or you have disabled third party cookies in your browser\'s settings.')
  console.log('Basic usage data will be collected anonymously.')
  console.log('Find out more at "https://www.offen.dev".')
  handler.handleAnonymousEvent(event.message)
    .then(Function.prototype, next)
}

function vault () {
  var registeredRoutes = {}
  var registeredMiddleware = []
  window.addEventListener('message', function (event) {
    var message = event.data
    var ports = event.ports

    function respond (message) {
      if (ports && ports.length) {
        ports[0].postMessage(message)
      }
    }

    var handlers = registeredRoutes[message.type].slice()
    function callNextHandler (index) {
      function next (err) {
        if (err) {
          respond({
            type: 'ERROR',
            payload: {
              error: err.message,
              stack: err.stack
            }
          })
        } else {
          callNextHandler(index + 1)
        }
      }
      handlers[index](event, respond, next)
    }
    callNextHandler(0)
  })

  return {
    route: function (messageType /* , ...handlerFns */) {
      var handlerFns = [].slice.call(arguments, 1)
      registeredRoutes[messageType] = registeredMiddleware.slice().concat(handlerFns)
    },
    use: function (/* ...handlerFns */) {
      registeredMiddleware = registeredMiddleware.concat([].slice.call(arguments))
    }
  }
}
