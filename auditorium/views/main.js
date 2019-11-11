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
      <p class="mt0 mb4">${raw(__('You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.', state.model.account.name))}</p>
    `
    pageTitle = state.model.account.name + ' | ' + state.title
  } else {
    accountHeader = html`
      <p class="dib pa2 black br2 bg-black-05 mt0 mb4">${raw(__('You are viewing your <strong>user</strong> data.'))}</p>
      ${state.model.hasOptedOut ? html`<p class="mt0 mb4 b">${__('You have opted out. Clear your cookies to opt in.')}</p>` : null}
      ${state.model.allowsCookies ? null : html`<p class="mt0 mb4 b"><strong>${__('Your browser does not allow 3rd party cookies. We respect this setting and collect only very basic data in this case, yet it also means we cannot display any data to you here.')}</p>`}
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
    var anchor = html`<a href="${url}" class="link dim gold">${range.display}</a>`
    return html`
      <li class="mb1">
        ${active ? html`<strong>${anchor}</strong>` : anchor}
      </li>
    `
  })
  var rangeSelector = html`
    <div class="w-100 w-40-ns pa3 mb2 mr1-ns ba b--black-10 br2 bg-white">
      <h4 class ="f5 normal mt0 mb3 gray">${__('Show data from the')}</h4>
      <ul class="list pl0 mt0 mb3">${ranges}</ul>
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
    <div class="flex flex-wrap w-100 w-60-ns pa3 mb2 ml1-ns ba b--black-10 br2 bg-white">
      <div class="w-50 mb3">
        <p class="mt0 mb0 f3 b">${uniqueEntities}</p>
        <p class="mt0 mb0 normal">${__('unique %s', entityName)}</p>
      </div>
      <div class="w-50 mb3">
        <p class="mt0 mb0 f3 b">${uniqueSessions}</p>
        <p class="mt0 mb0 normal">${__('unique sessions')}</p>
      </div>
      <div class="w-50 mb3">
        <p class="mt0 mb0 f3 b">${formatPercentage(state.model.bounceRate)}%</p>
        <p class="mt0 mb0 normal">${__('bounce rate')}</p>
      </div>
      <div class="w-50 mb3">
        ${isOperator ? html`
          <p class="mt0 mb0 f3 b">${formatPercentage(state.model.loss)}%</p>
          <p class="mt0 mb0 normal">${__('plus')}</p>
        ` : null}
      </div>
    </div>
  `

  var rowRangeUsersSessions = html`
      <div class="flex flex-column flex-row-ns">
        ${rangeSelector}
        ${usersAndSessions}
      </div>
    `

  var chartData = {
    data: state.model.pageviews,
    isOperator: isOperator,
    resolution: state.model.resolution
  }
  var chart = html`
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3 gray">${__('Pageviews and %s', isOperator ? __('Visitors') : __('Accounts'))}</h4>
      <div class="mb4">
        ${state.cache(BarChart, 'bar-chart').render(chartData)}
      </div>
    </div>
  `
  var pagesData = state.model.pages
    .map(function (row) {
      return html`
        <tr>
          <td class="pv2 bt b--black-10">${row.url}</td>
          <td class="pv2 bt b--black-10">${row.pageviews}</td>
        </tr>
      `
    })

  var pages = html`
    <h4 class ="f5 normal mt0 mb3 gray">${__('Top pages')}</h4>
    <table class="w-100 collapse mb3">
      <thead>
        <tr>
          <td class="pv2 b">${__('URL')}</td>
          <td class="pv2 b">${__('Pageviews')}</td>
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
          <td class="pv2 bt b--black-10">${row.host}</td>
          <td class="pv2 bt b--black-10">${row.pageviews}</td>
        </tr>
      `
    })

  var referrers = referrerData.length
    ? html`
      <h4 class ="f5 normal mt0 mb3 gray">${__('Top referrers')}</h4>
      <table class="w-100 collapse mb3">
        <thead>
          <tr>
            <td class="pv2 b">${__('Host')}</td>
            <td class="pv2 b">${__('Pageviews')}</td>
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
        <div class="w-100 w-30-ns pa3 mb2 ml1-ns ba b--black-10 br2 bg-white">
          <h4 class ="f5 normal mt0 mb3 gray">${__('Manage your data')}</h4>
          <button class="w-100-ns f5 link dim bn ph3 pv2 mr1 mb2 dib white bg-gold" data-role="purge" onclick="${handlePurge}">
            ${__('Delete my user data')}
          </button>
          <button class="w-100-ns f5 link dim bn ph3 pv2 mb3 dib white bg-gold" data-role="optout" onclick="${handleOptout}">
            ${state.model.hasOptedOut ? __('Opt in') : __('Opt out')}
          </button>
        </div>
    `
    : null

  var rowPagesReferrersManage = html`
      <div class="flex flex-column flex-row-ns">
        <div class="w-100 w-70-ns pa3 mb2 mr1-ns ba b--black-10 br2 bg-white">
          ${pages} ${referrers}
        </div>
        ${manage}
      </div>
    `

  var orderedSections = [accountHeader, rowRangeUsersSessions, chart, rowPagesReferrersManage]
  return html`
      <div>
        ${orderedSections}
      </div>
    `
}
