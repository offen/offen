var choo = require('choo')

var dataStore = require('./stores/data')
var mainView = require('./views/main')
var notFoundView = require('./views/404')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.use(dataStore)

app.route('/', mainView)
app.route('/*', notFoundView)

module.exports = app.mount(host)
