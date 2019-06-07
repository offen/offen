var html = require('choo/html')

var withTitle = require('./decorators/with-title')
var BarChart = require('./../components/bar-chart')

module.exports = withTitle(view, 'auditorium - offen')

function layout () {
  var elements = [].slice.call(arguments)
  var withSeparators = elements.map(function (el, index) {
    if (index < elements.length - 1) {
      return html`${el}<hr>`
    }
    return el
  })
  return html`
    <div class="container">
      <h1>offen auditorium</h1>
      <hr/>
      ${withSeparators}
    </div>
  `
}

function view (state, emit) {
  if (!state.model) {
    emit('offen:query', state.params)
    state.model = {
      eventsByDate: {},
      uniqueUsers: 0,
      uniqueSessions: 0,
      loading: true
    }
  }

  if (state.model.loading) {
    var loading = html`<p class="loading">Loading...</p>`
    return layout(loading)
  }

  if (state.model.error) {
    var content = html`
      <p class="error">An error occured: ${state.model.error.message}</p>
    `
    return layout(content)
  }

  var numDays = parseInt(state.query.num_days, 10) || 7

  var uniqueEntities = state.model.uniqueUsers
  var entityName = state.params && state.params.account_id ? 'users' : 'accounts'
  var users = html`
    <h4><strong>${uniqueEntities}</strong> unique ${entityName} in the last ${numDays} days</h4>
  `

  var uniqueSessions = state.model.uniqueSessions
  var sessions = html`
    <h4><strong>${uniqueSessions}</strong> unique sessions in the last ${numDays} days</h4>
  `

  var chart = html`
    <h4>Pageviews in the last ${numDays} days</h4>
    ${state.cache(BarChart, 'bar-chart').render(state.model.eventsByDate)}
  `

  return layout(users, sessions, chart)
}
