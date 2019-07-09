var choo = require('choo')
var sf = require('sheetify')
var _ = require('underscore')

var dataStore = require('./stores/data')
var authStore = require('./stores/auth')
var mainView = require('./views/main')
var loginView = require('./views/login')
var accountView = require('./views/account')
var notFoundView = require('./views/404')
var withAuthentication = require('./views/decorators/with-authentication')
var withTitle = require('./views/decorators/with-title')
var withModel = require('./views/decorators/with-model')
var withError = require('./views/decorators/with-error')
var withLayout = require('./views/decorators/with-layout')

sf('./index.css')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.use(dataStore)
app.use(authStore)

var decoratedMain = _.compose(
  withTitle('offen auditorium'),
  withModel(),
  withError()
)(mainView)

app.route(
  '/account/:accountId',
  withLayout()(withAuthentication()(decoratedMain))
)
app.route(
  '/account',
  withLayout()(withTitle('offen accounts')(withAuthentication()(accountView)))
)
app.route(
  '/login',
  withLayout()(withTitle('offen login')(loginView))
)
app.route(
  '/',
  withLayout()(decoratedMain)
)
app.route(
  '/*',
  withLayout()(withTitle('Not found')(notFoundView))
)

module.exports = app.mount(host)
