var choo = require('choo')
var _ = require('underscore')

var dataStore = require('./stores/data')
var authStore = require('./stores/auth')
var optInStore = require('./stores/opt-in')
var bailOutStore = require('./stores/bail-out')
var mainView = require('./views/main')
var loginView = require('./views/login')
var forgotPasswordView = require('./views/forgot-password')
var resetPasswordView = require('./views/reset-password')
var accountView = require('./views/account')
var notFoundView = require('./views/404')
var withAuthentication = require('./views/decorators/with-authentication')
var withTitle = require('./views/decorators/with-title')
var withModel = require('./views/decorators/with-model')
var withError = require('./views/decorators/with-error')
var withLayout = require('./views/decorators/with-layout')
var withPreviousRoute = require('./views/decorators/with-previous-route')

if (!window.URL || !window.URLSearchParams) {
  require('url-polyfill')
}

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.querySelector('#app-host').appendChild(host)

app.use(dataStore)
app.use(authStore)
app.use(bailOutStore)
app.use(optInStore)

function decorateWithDefaults (view, title) {
  var wrapper = _.compose(withPreviousRoute(), withLayout(), withError(), withTitle(title))
  return wrapper(view)
}

var base = (document.querySelector('base') && document.querySelector('base').getAttribute('href')) || '/'

app.route(
  base + 'account/:accountId',
  decorateWithDefaults(withAuthentication()(withModel()(mainView)), __('offen auditorium'))
)
app.route(
  base + 'account',
  decorateWithDefaults(withAuthentication()(accountView), __('offen accounts'))
)
app.route(
  base + 'login',
  decorateWithDefaults(loginView, __('offen login'))
)
app.route(
  base + 'reset-password/:token',
  decorateWithDefaults(resetPasswordView, __('offen reset password'))
)
app.route(
  base + 'reset-password',
  decorateWithDefaults(forgotPasswordView, __('offen forgot password'))
)
app.route(
  base.replace(/\/$/, ''),
  decorateWithDefaults(withModel()(mainView), __('offen auditorium'))
)
app.route(
  base + '*',
  decorateWithDefaults(notFoundView, __('Not found'))
)

module.exports = app.mount(host)
