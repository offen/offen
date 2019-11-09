var html = require('choo/html')
var raw = require('choo/html/raw')
var _ = require('underscore')

var BarChart = require('./../components/bar-chart')

module.exports = view

function formatPercentage (value) {
  return (value * 100).toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  })
}

function view (state, emit) {
  function handleOptout () {
    emit('offen:optout', !state.model.hasOptedOut)
  }

  function handlePurge () {
    emit('offen:purge')
  }

  var isOperator = !!(state.params && state.params.accountId)

  var accountHeader = null
  var pageTitle
  if (isOperator) {
    accountHeader = html`
      <div class="row">
        ${raw(__('You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.', state.model.account.name))}
      </div>
    `
    pageTitle = state.model.account.name + ' | ' + state.title
  } else {
    accountHeader = html`
      <div class="row">
        ${raw(__('You are viewing your <strong>user</strong> data.'))}
        ${state.model.hasOptedOut ? html`<p><strong>${__('You have opted out. Clear your cookies to opt in.')}</strong></p>` : null}
        ${state.model.allowsCookies ? null : html`<p><strong>${__('Your browser does not allow 3rd party cookies. We respect this setting and collect only very basic data in this case, yet it also means we cannot display any data to you here.')}</strong></p>`}
      </div>
    `
    pageTitle = __('user') + ' | ' + state.title
  }
  emit(state.events.DOMTITLECHANGE, pageTitle)

  var ranges = [
    { display: __('last 24 hours'), query: { range: '24', resolution: 'hours' } },
    { display: __('last 7 days'), query: null },
    { display: __('last 28 days'), query: { range: '28', resolution: 'days' } },
    { display: __('last 6 weeks'), query: { range: '6', resolution: 'weeks' } },
    { display: __('last 12 weeks'), query: { range: '12', resolution: 'weeks' } },
    { display: __('last 6 months'), query: { range: '6', resolution: 'months' } }
  ].map(function (range) {
    var url = (state.href || '') + '/'
    var current = _.pick(state.query, ['range', 'resolution'])
    var active = _.isEqual(current, range.query || {})
    var foreign = _.omit(state.query, ['range', 'resolution'])
    if (range.query || Object.keys(foreign).length) {
      url += '?' + new window.URLSearchParams(Object.assign(foreign, range.query))
    }
    var anchor = html`<a href="${url}">${range.display}</a>`
    return html`
      <li>
        ${active ? html`<strong>${anchor}</strong>` : anchor}
      </li>
    `
  })
  var rangeSelector = html`
    <div class="card col">
      <h4>${__('Show data from the')}</h4>
      <ul>${ranges}</ul>
    </div>
  `

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? __('users')
    : __('accounts')
  var uniqueSessions = state.model.uniqueSessions
  var usersAndSessions = html`
    <div class="card col">
      <div class="row">
        <div class="6 col">
          <h4><strong>${uniqueEntities}</strong> ${__('unique %s', entityName)}</h4>
        </div>
        <div class="6 col">
          <h4><strong>${uniqueSessions}</strong> ${__('unique sessions')}</h4>
        </div>
      </div>
      <div class="row">
        <div class="6 col">
          <h4><strong>${formatPercentage(state.model.bounceRate)}%</strong> ${__('bounce rate')}</h4>
        </div>
        <div class="6 col">
          ${isOperator ? html`<h4><strong>${formatPercentage(state.model.loss)}%</strong> ${__('plus')}</h4>` : null}
        </div>
      </div>
    </div>
  `
  var rowRangeUsersSessions = html`
    <div class="row">
      ${rangeSelector} ${usersAndSessions}
    </div>
    `

  var chartData = {
    data: state.model.pageviews,
    isOperator: isOperator,
    resolution: state.model.resolution
  }
  var chart = html`
    <div class="row">
      <div class="card col">
        <h4>${__('Pageviews and %s', isOperator ? __('Visitors') : __('Accounts'))}</h4>
        ${state.cache(BarChart, 'bar-chart').render(chartData)}
      </div>
    </div>
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
    <div class="card col">
      <h4>${__('Top pages')}</h4>
      <table class="w-100">
        <thead>
          <tr>
            <td>${__('URL')}</td>
            <td>${__('Pageviews')}</td>
          </tr>
        </thead>
        <tbody>
          ${pagesData}
        </tbody>
      </table>
    </div>
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
      <h4>${__('Top referrers')}</h4>
      <table class="w-100">
        <thead>
          <tr>
            <td>${__('Host')}</td>
            <td>${__('Pageviews')}</td>
          </tr>
        </thead>
        <tbody>
          ${referrerData}
        </tbody>
      </table>
    `
    : null

  var manage = !isOperator && state.model.allowsCookies
    ? html`
      <div class="card col">
        <h4>${__('Manage your data')}</h4>
          <a class="btn primary" data-role="optout" onclick="${handleOptout}">
            ${state.model.hasOptedOut ? __('Opt in') : __('Opt out')}
          </a>
          <a class="btn primary" data-role="purge" onclick="${handlePurge}">
            ${__('Delete my data')}
          </a>
        </div>
    `
    : null

  var rowPagesReferrersManage = html`
      <div class="row">
        ${pages} ${referrers} ${manage}
      </div>
    `

  var withoutSeparators = [accountHeader, rowRangeUsersSessions, chart, rowPagesReferrersManage]
  return html`
      <div>
        ${withoutSeparators}
      </div>
    `
}
