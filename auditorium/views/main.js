var html = require('choo/html')

var withTitle = require('./decorators/with-title')

module.exports = withTitle(view, 'auditorium - offen')

function view (state, emit) {
  if (!state.model) {
    state.model = {
      events: []
    }
  }

  if (!state.model.events.length) {
    emit('offen:query')
  }

  var eventElements = state.model.events.map(function (item) {
    var event = item.payload
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
