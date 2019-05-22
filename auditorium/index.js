const choo = require('choo')
const html = require('choo/html')

const vault = require('./packages/vault')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}

const host = document.createElement('div')
document.body.appendChild(host)

app.route('/', mainView)
app.mount(host)

app.use(function (state, emitter) {
  emitter.on('query', function () {
    function digestResponse (event) {
      let message
      try {
        message = JSON.parse(event.data)
      } catch (err) {
        console.error(err)
        return
      }
      state.data = message.payload.result.map(function (item) {
        return JSON.parse(item.payload)
      })
      emitter.emit('render')
      window.removeEventListener('message', digestResponse)
    }

    window.addEventListener('message', digestResponse)

    vault(process.env.VAULT_HOST).then(function (el) {
      const pageviewEvent = {
        type: 'QUERY',
        payload: null
      }
      el.contentWindow.postMessage(
        JSON.stringify(pageviewEvent),
        process.env.VAULT_HOST
      )
    })
  })
})

function mainView (state, emit) {
  if (!state.data) {
    state.data = []
    emit('query')
  }

  const eventElements = state.data.map(function (event) {
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
