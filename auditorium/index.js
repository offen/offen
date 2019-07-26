var choo = require('choo')
var sf = require('sheetify')
var _ = require('underscore')

var dataStore = require('./stores/data')
var authStore = require('./stores/auth')
var bailOutStore = require('./stores/bail-out')
var mainView = require('./views/main')
var loginView = require('./views/login')
var accountView = require('./views/account')
var notFoundView = require('./views/404')
var withAuthentication = require('./views/decorators/with-authentication')
var withTitle = require('./views/decorators/with-title')
var withModel = require('./views/decorators/with-model')
var withError = require('./views/decorators/with-error')
var withLayout = require('./views/decorators/with-layout')

sf('./styles/index.css')
sf('./index.css')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.use(dataStore)
app.use(authStore)
app.use(bailOutStore)

function decorateWithDefaults (view, title) {
  var wrapper = _.compose(withLayout(), withError(), withTitle(title))
  return wrapper(view)
}

app.route(
  '/account/:accountId',
  decorateWithDefaults(withAuthentication()(withModel()(mainView)), 'offen auditorium')
)
app.route(
  '/account',
  decorateWithDefaults(withAuthentication()(accountView), 'offen accounts')
)
app.route(
  '/login',
  decorateWithDefaults(loginView, 'offen login')
)
app.route(
  '/',
  decorateWithDefaults(withModel()(mainView), 'offen auditorium')
)
app.route(
  '/*',
  decorateWithDefaults(notFoundView, 'Not found')
)

module.exports = app.mount(host)
