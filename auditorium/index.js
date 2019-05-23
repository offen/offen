var choo = require('choo')
var html = require('choo/html')
var vault = require('offen/vault')

var app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

var host = document.createElement('div')
document.body.appendChild(host)

app.route('/', mainView)
app.mount(host)

app.use(function (state, emitter) {
  emitter.on('query', function () {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'QUERY',
          respondWith: 'initial-query',
          payload: null
        }
        return postMessage(queryRequest)
      })
      .then(function (message) {
        state.data = message.payload.result.map(function (item) {
          return item.payload
        })
      })
      .catch(function (err) {
        state.error = err
      })
      .then(function () {
        emitter.emit('render')
      })
  })
})

function mainView (state, emit) {
  if (!state.data) {
    state.data = []
    emit('query')
  }

  var eventElements = state.data.map(function (event) {
    return html`
      <tr>
        <td>${event.type}</td>
        <td>${event.href}</td>
        <td>${event.referrer}</td>
        <td>${event.sessionId}</td>
        <td>${event.timestamp}</td>
        <td>${event.title}</td>
      </tr>
    `
  })
  return html`
    <div class="container">
      <h1>offen auditorium</h1>
      <table class="u-full-width">
        <thead>
          <tr>
            <th>type</th>
            <th>href</th>
            <th>referrer</th>
            <th>sessionId</th>
            <th>timestamp</th>
            <th>title</th>
          </tr>
        </thead>
        <tbody>
         ${eventElements}
        </tbody>
      </table>
    </div>
  `
}
