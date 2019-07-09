var html = require('choo/html')

var BarChart = require('./../components/bar-chart')

module.exports = view

function view (state, emit) {
  var isOperator = !!(state.params && state.params.accountId)

  var numDays = parseInt(state.query.num_days, 10) || 7

  var accountHeader = null
  var pageTitle
  if (isOperator) {
    accountHeader = html`
      <h3><strong>You are viewing data as</strong> operator <strong>with account</strong> ${state.model.account.name}.</h3>
      <h3><strong>This is the data collected over the last </strong> ${numDays} days.</h3>
    `
    pageTitle = state.model.account.name + ' | ' + state.title
  } else {
    accountHeader = html`
      <h3><strong>You are viewing data as</strong> user.</h3>
      <h3><strong>This is your data collected over the last</strong> ${numDays} days <strong>across all sites.</strong></h3>
    `
    pageTitle = 'user | ' + state.title
  }
  emit(state.events.DOMTITLECHANGE, pageTitle)

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? 'users'
    : 'accounts'
  var uniqueSessions = state.model.uniqueSessions
  var bounceRate = (state.model.bounceRate * 100).toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  })
  var usersAndSessions = html`
    <div class="row">
      <h4><strong>${uniqueEntities}</strong> unique ${entityName} </h4>
      <h4><strong>${uniqueSessions}</strong> unique sessions</h4>
      <h4><strong>${bounceRate}%</strong> bounce rate</h4>
    </div>
  `

  var chartData = {
    data: state.model.pageviews,
    isOperator: isOperator
  }
  var chart = html`
    <h4>Pageviews and Visitors</h4>
    ${state.cache(BarChart, 'bar-chart').render(chartData)}
  `
  var pagesData = state.model.pages
    .map(function (row) {
      return html`
        <tr>
          <td>${row.url}</td>
          <td>${row.pageviews}</td>
        </tr>
      `
    })

  var pages = html`
    <h4>Top pages</h4>
    <table class="table-full-width">
      <thead>
        <tr>
          <td>URL</td>
          <td>Pageviews</td>
        </tr>
      </thead>
      <tbody>
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

  var referrers = referrerData.length
    ? html`
      <h4>Top referrers</h4>
      <table class="table-full-width">
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
    : null

  var withSeparators = [accountHeader, usersAndSessions, chart, pages, referrers].map(function (el) {
    return html`${el}<hr>`
  })
  return html`
    <div>
      ${withSeparators}
    </div>
  `
}
