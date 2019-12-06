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
  function handlePurge () {
    emit('offen:purge')
  }

  var isOperator = !!(state.params && state.params.accountId)
  var accountHeader = null
  var pageTitle
  if (isOperator) {
    var copy = __(
      'You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.',
      state.model.account.name
    )
    accountHeader = html`
      <p class="dib pa2 br2 bg-black-05 mt0 mb2">
        ${raw(copy)}
      </p>
    `
    pageTitle = state.model.account.name + ' | ' + state.title
  } else {
    pageTitle = __('user') + ' | ' + state.title
    accountHeader = html`
      <p class="dib pa2 br2 bg-black-05 mt0 mb2">
        ${raw(__('You are viewing your <strong>user</strong> data.'))}
      </p>
    `
    if (!state.model.allowsCookies) {
      var noCookiesCopy = __('Your browser does not allow 3rd party cookies. We respect this setting and collect only very basic data in this case, yet it also means we cannot display any data to you here.')
      accountHeader = [
        accountHeader,
        html`
          <p class="dib pa2 black br2 bg-black-05 mt0 mb2">
            <strong>
              ${noCookiesCopy}
            </strong>
          </p>
        `
      ]
    }
  }
  emit(state.events.DOMTITLECHANGE, pageTitle)

  var ranges = [
    { display: __('24 hours'), query: { range: '24', resolution: 'hours' } },
    { display: __('7 days'), query: null },
    { display: __('28 days'), query: { range: '28', resolution: 'days' } },
    { display: __('6 weeks'), query: { range: '6', resolution: 'weeks' } },
    { display: __('12 weeks'), query: { range: '12', resolution: 'weeks' } },
    { display: __('6 months'), query: { range: '6', resolution: 'months' } }
  ].map(function (range) {
    var url = (state.href || '') + '/'
    var current = _.pick(state.query, ['range', 'resolution'])
    var activeRange = _.isEqual(current, range.query || {})
    var foreign = _.omit(state.query, ['range', 'resolution'])
    if (range.query || Object.keys(foreign).length) {
      url += '?' + new window.URLSearchParams(Object.assign(foreign, range.query))
    }
    var anchorRange = html`
      <a href="${url}" class="link dim bn ph3 pv2 mr2 mb1 dib br1 white bg-dark-green">
        ${range.display}
      </a>
    `
    return html`
      <li class="mb1">
        ${activeRange
    ? html`
      <a href="${url}" class="f5 b link bb bw2 ph3 pv2 mr2 mb1 dib br1 dark-green bg-black-05">
        ${range.display}
      </a>
    `
    : anchorRange
}
      </li>
    `
  })

  var rangeSelector = html`
      <h4 class ="f5 normal mt0 mb3">${__('Show data from the last')}</h4>
      <ul class="flex flex-wrap list pl0 mt0 mb3">${ranges}</ul>
    `

  if (isOperator) {
    var availableAccounts = state.authenticatedUser.accounts
      .slice()
      .sort(function (a, b) {
        return a.accountName.localeCompare(b.accountName)
      })
      .map(function (account) {
        var buttonClass = null
        if (account.accountId === state.params.accountId) {
          buttonClass = 'b link bb bw2 ph3 pv2 mr2 mb1 dib br1 mid-gray bg-white-50'
        } else {
          buttonClass = 'link dim bn ph3 pv2 mr2 mb1 dib br1 white bg-mid-gray'
        }
        return html`
          <li>
            <a href="./account/${account.accountId}/" class="${buttonClass}">
              ${account.accountName}
            </a>
          </li>
        `
      })
  }

  var chooseAccounts = html`
      <h4 class ="f5 normal mt0 mb3">Choose account</h4>
      <ul class="flex flex-wrap list pl0 mt0 mb3">
        ${availableAccounts}
      </ul>
    `

  var manageOperator = html`
    <div class="w-100 w-30-ns pa3 mb2 mr2-ns br2 bg-black-05">
      ${chooseAccounts}
    </div>
    `

  var manageUser = !isOperator && state.model.allowsCookies
    ? html`
      <div class="w-100 w-30-ns pa3 mb2 mr2-ns br2 bg-black-05">
        <h4 class ="f5 normal mt0 mb3">${__('Manage data')}</h4>
        <button class="pointer w-100-ns f5 link dim bn ph3 pv2 mr1 mb2 dib br1 white bg-mid-gray" data-role="purge" onclick="${handlePurge}">
          ${raw(__('Delete my <strong>user</strong> data'))}
        </button>
        <button class="pointer w-100-ns f5 link bn ph3 pv2 mb3 dib br1 white bg-black-05" data-role="optin" disabled>
          ${__('Opt me in')}
        </button>
      </div>
    `
    : null

  var firstCardContent = isOperator ? manageOperator : manageUser
  var rowRangeManage = html`
      <div class="flex flex-column flex-row-ns mt4">
        ${firstCardContent}
        <div class="w-100 w-70-ns pa3 mb2 ba b--black-10 br2 bg-white">
          ${rangeSelector}
        </div>
      </div>
    `

  var chartData = {
    data: state.model.pageviews,
    isOperator: isOperator,
    resolution: state.model.resolution
  }

  var chart = html`
    <div class="w-100 w-75-m w-80-ns pa3 mb2 mr2-ns ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3">
        ${__('Page views and %s', isOperator ? __('visitors') : __('accounts'))}
      </h4>
      <div class="mb4">
        ${state.cache(BarChart, 'bar-chart').render(chartData)}
      </div>
    </div>
  `

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? __('Users')
    : __('Accounts')

  function keyMetric (name, value) {
    return html`
      <div class="w-50 w-100-ns mb3 mb4-ns">
        <p class="mv0 f2">${value}</p>
        <p class="mv0 normal">${name}</p>
      </div>
    `
  }

  var uniqueSessions = state.model.uniqueSessions
  var keyMetrics = html`
    <div class="w-100 w-25-m w-20-ns pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class ="f5 normal mt0 mb3 mb4-ns">Key metrics</h4>
      <div class="flex flex-wrap">
        ${keyMetric(__('Unique %s', entityName), uniqueEntities)}
        ${keyMetric(__('Unique Sessions'), uniqueSessions)}
        ${keyMetric(__('Bounce Rate'), `${formatPercentage(state.model.bounceRate)} %`)}
        ${isOperator && state.model.loss ? keyMetric(__('Plus'), `${formatPercentage(state.model.loss)} %`) : null}
        ${state.model.avgPageload ? keyMetric(__('Avg. Page Load time'), `${Math.round(state.model.avgPageload)} ms`) : null}
        ${state.model.avgPageDepth ? keyMetric(__('Avg. Page Depth'), state.model.avgPageDepth.toFixed(1)) : null}
      </div>
    </div>
  `

  var rowUsersSessionsChart = html`
    <div class="flex flex-column flex-row-ns">
      ${chart}
      ${keyMetrics}
    </div>
  `

  function urlTable (headline, col1Label, col2Label, rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return null
    }
    var data = rows.map(function (row) {
      return html`
        <tr>
          <td class="pv2 bt b--black-10">${row.url}</td>
          <td class="pv2 bt b--black-10">${row.pageviews}</td>
        </tr>
      `
    })
    return html`
      <h4 class ="f5 normal mt0 mb3">${headline}</h4>
      <table class="w-100 collapse mb3 dt--fixed">
        <thead>
          <tr>
            <td class="pv2 b">${col1Label}</td>
            <td class="pv2 b">${col2Label}</td>
          </tr>
        </thead>
        <tbody>
          ${data}
        </tbody>
      </table>
    `
  }

  var urlTables = html`
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      ${urlTable(__('Top pages'), __('URL'), __('Pageviews'), state.model.pages)}
      ${urlTable(__('Top referrers'), __('Host'), __('Pageviews'), state.model.referrers)}
      ${urlTable(__('Landing pages'), __('URL'), __('Landings'), state.model.landingPages)}
      ${urlTable(__('Exit pages'), __('URL'), __('Exits'), state.model.exitPages)}
    </div>
  `

  var goSettings = isOperator
    ? html`
        <div class="flex flex-column flex-row-ns mt4">
          <div class="w-100 w-20-ns pa3 mb2 mr2-ns br2 bg-black-05">
            <h4 class ="f5 normal mt0 mb3">
              ${__('Admin console')}
            </h4>
            <a href="/auditorium/account/" class="w-100-ns f5 tc link dim bn ph3 pv2 mr1 mb2 dib br1 white bg-mid-gray">
              ${__('Settings')}
            </a>
          </div>
          <div class="dn db-ns w-100 w-80-ns pa3 mb2 br2 bg-black-05">
          </div>
        </div>
      `
    : null

  return html`
      <div>
        ${accountHeader}
        ${rowRangeManage}
        ${rowUsersSessionsChart}
        ${urlTables}
        ${goSettings}
      </div>
    `
}
