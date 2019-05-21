const choo = require('choo')
const html = require('choo/html')
const devtools = require('choo-devtools')

const app = choo()
app.use(devtools())
app.route('/', mainView)
app.mount('body')

function mainView (state, emit) {
  return html`
    <body>
      <h1>offen auditorium</h1>
      <p>Data will be displayed here soon ...</p>
    </body>
  `
}
