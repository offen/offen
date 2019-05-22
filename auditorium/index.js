const choo = require('choo')
const html = require('choo/html')

const app = choo()

if (process.env.NODE_ENV !== 'production') {
  // app.use(require('choo-devtools')())
}

const host = document.createElement('div')
document.body.appendChild(host)

app.route('/', mainView)
app.mount(host)

app.use(function (state, emitter) {
  const vault = document.createElement('iframe')
  vault.src = process.env.VAULT_HOST

  vault.style.display = 'none'
  vault.setAttribute('width', '0')
  vault.setAttribute('height', '0')
  vault.setAttribute('frameBorder', '0')
  vault.setAttribute('scrolling', 'no')

  const ready = new Promise(function (resolve) {
    vault.addEventListener('load', function (e) {
      resolve(e.target)
    })
  })

  emitter.on('query', function () {
    function digestResponse (event) {
      let message
      try {
        message = JSON.parse(event.data)
      } catch (err) {
        console.error(err)
        return
      }
      state.data = message.payload.result
      emitter.emit('render')
      window.removeEventListener('message', digestResponse)
    }

    window.addEventListener('message', digestResponse)

    ready.then(function (el) {
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

  document.body.appendChild(vault)
})

function mainView (state, emit) {
  if (!state.data) {
    state.data = []
    emit('query')
  }

  const eventElements = state.data.map(function (event) {
    return html`
      <li>
        <pre>${JSON.stringify(event, null, 2)}</pre>
      </li>
    `
  })
  return html`
    <div>
      <h1>offen auditorium</h1>
      <ul>
       ${eventElements}
      </ul>
    </div>
  `
}
