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
    <div class="section">
      <h1>offen auditorium user</h1>
      ${withSeparators}
    </div>
  `
}

function view (state, emit) {
  if (!state.model) {
    emit('offen:query', Object.assign({}, state.params, state.query))
    state.model = {
      pageviews: [],
      referrers: [],
      uniqueUsers: 0,
      uniqueSessions: 0,
      loading: true,
      pages: []
    }
  }

  if (state.model.loading) {
    var loading = html`<p class="loading">Loading...</p>`
    return layout(loading)
  }

  if (state.model.error) {
    var content = html`
      <p class="error">An error occured: ${state.model.error.message}</p>
      <pre>${state.model.error.stack}</pre>
    `
    return layout(content)
  }

  var isOperator = !!(state.params && state.params.accountId)

  var accountHeader = null
  if (isOperator) {
    accountHeader = html`
      <h3>Account: <strong>${state.model.account.name}</strong></h3>
    `
  } else {
    accountHeader = html`
      <h3>Your data across all sites</h3>
    `
  }

  var numDays = parseInt(state.query.numDays, 10) || 7

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? 'users'
    : 'accounts'
  var uniqueSessions = state.model.uniqueSessions
  var usersAndSessions = html`
    <div class="row">
      <div class="six columns">
        <h4><strong>${uniqueEntities}</strong> unique ${entityName} in the last ${numDays} days</h4>
      </div>
      <div class="six columns">
        <h4><strong>${uniqueSessions}</strong> unique sessions in the last ${numDays} days</h4>
      </div>
    </div>
  `

  var chart = html`
    <h4>Pageviews in the last ${numDays} days</h4>
    ${state.cache(BarChart, 'bar-chart').render(state.model.pageviews)}
  `
  var pagesData = state.model.pages
    .map(function (row) {
      return html`
        <tr>
          <td>${row.origin}</td>
          <td>${row.pathname}</td>
          <td>${row.pageviews}</td>
        </tr>
      `
    })

  var pages = html`
    <h4>Top pages in the last ${numDays} days:</h4>
    <table class="u-full-width">
      <thead>
        <tr>
          <td>Host</td>
          <td>Path</td>
          <td>Pageviews</td>
        </tr>
      </thead>
      <tbody class="top_pages">
        ${pagesData}
      </tbody>
    </table>
  `
  var referrerData = state.model.referrers
    .map(function (row) {
      return html`
        <tr>
          <td>${row.host}</td>
          <td>${row.pageviews}</td>
        </tr>
      `
    })

  var referrers = html`
    <h4>Top referrers in the last ${numDays} days:</h4>
    <table class="u-full-width">
      <thead>
        <tr>
          <td>Host</td>
          <td>Pageviews</td>
        </tr>
      </thead>
      <tbody class="top_referrers">
        ${referrerData}
      </tbody>
    </table>
  `

  return layout(accountHeader, usersAndSessions, chart, pages, referrers)
}
