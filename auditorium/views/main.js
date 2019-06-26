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
      <pre>${state.model.error.stack}</pre>
    `
    return layout(content)
  }

  var isOperator = !!(state.params && state.params.account_id)

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

  var numDays = parseInt(state.query.num_days, 10) || 7

  var uniqueEntities = state.model.uniqueUsers
  var uniqueSessions = state.model.uniqueSessions
  var entityName = isOperator ? 'users' : 'accounts'
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
    ${state.cache(BarChart, 'bar-chart').render(state.model.eventsByDate)}
  `

  var pagesData = Object.keys(state.model.pages)
    .map(function (page) {
      return { page: page, data: state.model.pages[page] }
    })
    .sort(function (a, b) {
      if (a.data.pageviews > b.data.pageviews) {
        return -1
      } else if (a.data.pageviews === b.data.pageviews) {
        return 0
      }
      return 1
    })
    .map(function (row) {
      return html`
        <tr>
          <td>${row.data.origin}</td>
          <td>${row.data.pathname}</td>
          <td>${row.data.pageviews}</td>
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
      <tbody>
        ${pagesData}
      </tbody>
    </table>
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
    <h4>Top referrers in the last ${numDays} days:</h4>
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

  return layout(accountHeader, usersAndSessions, chart, pages, referrers)
}
