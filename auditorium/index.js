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

sf('./index.css')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.use(dataStore)
app.use(authStore)

var withDecorators = _.compose(withTitle('offen auditorium'), withModel(), withError())
var decoratedMain = withDecorators(mainView)

app.route(
  '/account/:accountId',
  withAuthentication()(decoratedMain)
)
app.route(
  '/account',
  withTitle('offen accounts')(withAuthentication()(accountView))
)
app.route(
  '/login',
  withTitle('offen login')(loginView)
)
app.route(
  '/',
  decoratedMain
)
app.route(
  '/*',
  withTitle('Not found')(notFoundView)
)

module.exports = app.mount(host)
