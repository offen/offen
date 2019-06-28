var choo = require('choo')
var sf = require('sheetify')

var dataStore = require('./stores/data')
var mainView = require('./views/main')
var notFoundView = require('./views/404')

sf('./index.css')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.use(dataStore)

app.route('/account/:accountId', mainView)
app.route('/', mainView)
app.route('/*', notFoundView)

module.exports = app.mount(host)
