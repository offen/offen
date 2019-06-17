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
      referrers: {},
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

  var accountHeader = null
  if (state.params && state.params.account_id) {
    accountHeader = html`
      <h3>Account: <strong>${state.model.account.name}</strong></h3>
    `
  } else {
    accountHeader = html`
      <h3>Your data across all sites</h3>
    `
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

  var referrerData = Object.keys(state.model.referrers)
    .map(function (host) {
      return { host: host, pageviews: state.model.referrers[host] }
    })
    .sort(function (a, b) {
      if (a.pageviews > b.pageviews) {
        return -1
      } else if (a.pageviews === b.pageviews) {
        return 0
      }
      return 1
    })
    .map(function (row) {
      return html`
        <tr>
          <td>${row.host}</td>
          <td>${row.pageviews}</td>
        </tr>
      `
    })

  var referrers = html`
    <h4>Top referrers:</h4>
    <table class="u-full-width">
      <thead>
        <tr>
          <td>Host</td>
          <td>Pageviews</td>
        </tr>
      </thead>
      <tbody>
        ${referrerData}
      </tbody>
    </table>
  `

  return layout(accountHeader, users, sessions, chart, referrers)
}
