var choo = require('choo')
var _ = require('underscore')

var dataStore = require('./stores/data')
var authStore = require('./stores/auth')
var consentStore = require('./stores/consent')
var bailOutStore = require('./stores/bail-out')
var navigationStore = require('./stores/navigation')
var indexView = require('./views/index')
var mainView = require('./views/main')
var loginView = require('./views/login')
var forgotPasswordView = require('./views/forgot-password')
var resetPasswordView = require('./views/reset-password')
var consoleView = require('./views/console')
var notFoundView = require('./views/404')
var withAuthentication = require('./views/decorators/with-authentication')
var withTitle = require('./views/decorators/with-title')
var withModel = require('./views/decorators/with-model')
var withConsentStatus = require('./views/decorators/with-consent-status')
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
app.use(consentStore)
app.use(navigationStore)

function decorateWithDefaults (view, title, headline) {
  var wrapper = _.compose(withPreviousRoute(), withLayout(headline), withError(), withTitle(title))
  return wrapper(view)
}

app.route(
  '/auditorium/:accountId',
  decorateWithDefaults(withAuthentication()(withModel()(mainView)), __('Offen Auditorium'))
)
app.route(
  '/auditorium',
  decorateWithDefaults(withConsentStatus(true)(withModel()(mainView)), __('Offen Auditorium'))
)
app.route(
  '/console',
  decorateWithDefaults(withAuthentication()(consoleView), __('Offen console'))
)
app.route(
  '/login',
  decorateWithDefaults(loginView, __('Offen login'))
)
app.route(
  '/reset-password/:token',
  decorateWithDefaults(resetPasswordView, __('Offen reset password'))
)
app.route(
  '/reset-password',
  decorateWithDefaults(forgotPasswordView, __('Offen forgot password'))
)
app.route(
  '/',
  decorateWithDefaults(withConsentStatus()(indexView), __('Offen'), __('Offen'))
)
app.route(
  '*',
  decorateWithDefaults(notFoundView, __('Not found'))
)

module.exports = app.mount(host)
