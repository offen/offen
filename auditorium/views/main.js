var html = require('choo/html')
var raw = require('choo/html/raw')
var _ = require('underscore')

var BarChart = require('./../components/bar-chart')
var Table = require('./../components/table')

module.exports = view

function keyMetric (name, value) {
  return html`
      <div class="w-50 w-100-ns mb3 mb4-ns">
        <p class="mv0 f2">${value}</p>
        <p class="mv0 normal">${name}</p>
      </div>
    `
}

function retentionSquare (value) {
  if (value === null) {
    return null
  }
  return html`
    <div title="${formatNumber(value, 100)}%">
      <div
        style="opacity: ${value !== 0 ? (value * 0.75 + 0.25) : 1}"
        class="${value !== 0 ? 'bg-dark-green' : 'bg-light-gray'} h3 w-100"
      >
      </div>
    </div>
  `
}

function relativeTime (offset) {
  if (offset === 0) {
    return __('This week')
  }
  return __('%d days earlier', offset * 7)
}

function retentionTable (matrix) {
  var rows = matrix.map(function (row, index) {
    var elements = row.slice()
    while (elements.length < matrix[0].length) {
      elements.push(null)
    }
    return html`
      <tr>
        <td>${relativeTime(index)}</td>
        ${elements.map(function (element) { return html`<td>${retentionSquare(element)}</td>` })}
      </tr>
    `
  })
  return html`
    <table class="w-100 collapse mb3 dt--fixed">
      <thead>
        <tr>
          <td></td>
          ${matrix.map(function (row, index) { return html`<td>${relativeTime(index)}</td>` })}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `
}

function formatNumber (value, factor) {
  return (value * (factor || 1)).toLocaleString(process.env.LOCALE, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  })
}

function view (state, emit) {
  var userHasOptedIn = state.consentStatus && state.consentStatus.status === 'allow'

  function handleConsent () {
    var nextStatus = userHasOptedIn ? 'deny' : 'allow'
    emit('offen:express-consent', nextStatus, function (state, emitter) {
      var flashMessage = nextStatus === 'deny'
        ? __('You have successfully opted out, all usage data has been deleted')
        : __('You have now opted in.')
      state.flash = flashMessage
      emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
    })
  }

  function handlePurge () {
    emit('offen:purge')
  }

  var isOperator = !!(state.params && state.params.accountId)

  if (isOperator) {
    emit('offen:schedule-refresh', 15000)
  }

  var accountHeader = null
  var pageTitle
  if (isOperator) {
    var copy = __(
      'You are viewing data as <strong>operator</strong> with account <strong>%s</strong>.',
      state.model.account.name
    )
    accountHeader = html`
      <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">
        ${raw(copy)}
      </p>
    `
    pageTitle = state.model.account.name + ' | ' + state.title
  } else {
    pageTitle = __('user') + ' | ' + state.title
    accountHeader = html`
      <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">
        ${raw(__('You are viewing your <strong>usage data.</strong> '))}
      </p>
    `
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

  var manage = null
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
            <a href="/auditorium/${account.accountId}/" class="${buttonClass}">
              ${account.accountName}
            </a>
          </li>
        `
      })
    manage = html`
      <h4 class ="f5 normal mt0 mb3">Choose account</h4>
      <ul class="flex flex-wrap list pl0 mt0 mb3">
        ${availableAccounts}
      </ul>
    `
  } else {
    var deleteButton = null
    if (userHasOptedIn) {
      deleteButton = html`
        <button class="pointer w-100-ns f5 link dim bn ph3 pv2 mr1 mb2 dib br1 white bg-mid-gray" data-role="purge" onclick="${handlePurge}">
          ${raw(__('Delete my <strong>usage data</strong>'))}
        </button>
      `
    }
    manage = html`
      <h4 class ="f5 normal mt0 mb3">${__('Manage data')}</h4>
      ${deleteButton}
      <button class="pointer w-100-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" data-role="consent" onclick=${handleConsent}>
        ${userHasOptedIn ? raw(__('Opt out and delete my <strong>usage data</strong>')) : __('Opt in')}
      </button>
    `
  }

  var rowRangeManage = html`
    <div class="flex flex-column flex-row-ns mt4">
      <div class="w-100 w-30-ns pa3 mb2 mr2-ns br0 br2-ns bg-black-05">
        ${manage}
      </div>
      <div class="w-100 w-70-ns pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
        ${rangeSelector}
      </div>
    </div>
  `

  var live = null
  if (isOperator) {
    var tableData = { headline: __('Currently active pages'), col1Label: __('URL'), col2Label: __('Visitors'), rows: state.model.livePages }
    live = html`
      <div class="w-100 pa3 mb2 mr2-ns bt bb ba-ns br0 br2-ns b--black-10 bg-white flex flex-column">
        <div class="flex flex-column flex-row-ns">
          <div class="w-100 w-30-ns">
            <h4 class="f5 normal mt0 mb3">
              ${__('Right now')}
            </h4>
            ${keyMetric('Unique users', state.model.liveUsers)}
          </div>
          <div class="w-100 w-70-ns">
            ${state.cache(Table, 'main/live-table').render([tableData])}
          </div>
        </div>
      </div>
    `
  }

  var chartData = {
    data: state.model.pageviews,
    isOperator: isOperator,
    resolution: state.model.resolution
  }

  var chart = html`
    <div class="w-100 w-75-m w-80-ns pa3 mb2 mr2-ns bt bb ba-ns br0 br2-ns b--black-10 bg-white flex flex-column">
      <h4 class="f5 normal mt0 mb3">
        ${__('Page views and %s', isOperator ? __('visitors') : __('accounts'))}
      </h4>
      ${state.cache(BarChart, 'main/bar-chart').render(chartData)}
    </div>
  `

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? __('Users')
    : __('Accounts')

  var uniqueSessions = state.model.uniqueSessions
  var keyMetrics = html`
    <div class="w-100 w-25-m w-20-ns pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      <h4 class ="f5 normal mt0 mb3 mb4-ns">Key metrics</h4>
      <div class="flex flex-wrap">
        ${keyMetric(__('Unique %s', entityName), uniqueEntities)}
        ${keyMetric(__('Unique Sessions'), uniqueSessions)}
        <hr class="mt0 mb3 w-100 bb bw1 b--black-10">
        ${state.model.avgPageDepth ? keyMetric(__('Avg. Page Depth'), formatNumber(state.model.avgPageDepth)) : null}
        ${keyMetric(__('Bounce Rate'), `${formatNumber(state.model.bounceRate, 100)} %`)}
        ${isOperator && state.model.loss ? keyMetric(__('Plus'), `${formatNumber(state.model.loss, 100)} %`) : null}
        <hr class="mt0 mb3 w-100 bb bw1 b--black-10">
        ${keyMetric(__('Mobile Users'), `${formatNumber(state.model.mobileShare, 100)} %`)}
        ${state.model.avgPageload ? keyMetric(__('Avg. Page Load time'), `${Math.round(state.model.avgPageload)} ms`) : null}
      </div>
    </div>
  `

  var rowUsersSessionsChart = html`
    <div class="flex flex-column flex-row-ns">
      ${chart}
      ${keyMetrics}
    </div>
  `

  var pagesTableData = [
    { headline: __('Top pages'), col1Label: __('URL'), col2Label: __('Pageviews'), rows: state.model.pages }
  ]
  var referrersTableData = [
    { headline: __('Top referrers'), col1Label: __('Host'), col2Label: __('Pageviews'), rows: state.model.referrers },
    { headline: __('Top campaigns'), col1Label: __('Campaign'), col2Label: __('Pageviews'), rows: state.model.campaigns },
    { headline: __('Top sources'), col1Label: __('Source'), col2Label: __('Pageviews'), rows: state.model.sources }
  ]
  var landingExitTableData = [
    { headline: __('Landing pages'), col1Label: __('URL'), col2Label: __('Landings'), rows: state.model.landingPages },
    { headline: __('Exit pages'), col1Label: __('URL'), col2Label: __('Exits'), rows: state.model.exitPages }
  ]
  var urlTables = html`
    <div class="w-100 pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      ${state.cache(Table, 'main/pages-table').render(pagesTableData)}
    </div>
    <div class="w-100 pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      ${state.cache(Table, 'main/referrers-table').render(referrersTableData)}
    </div>
    <div class="w-100 pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      ${state.cache(Table, 'main/landing-exit-table').render(landingExitTableData)}
    </div>
  `

  var retention = html`
    <div class="w-100 pa3 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      <h4 class ="f5 normal mt0 mb3 mb4-ns">Weekly retention</h4>
      ${retentionTable(state.model.retentionMatrix)}
    </div>
  `
  var goSettings = isOperator
    ? html`
      <div class="flex flex-column flex-row-ns mt4">
        <div class="w-100 w-20-ns pa3 mb2 mr2-ns br0 br2-ns bg-black-05">
          <h4 class ="f5 normal mt0 mb3">
            ${__('Admin console')}
          </h4>
          <div class="flex items-center">
            <a href="/console/" class="w-100-ns f5 tc link dim bn ph3 pv2 mr1 mb2 dib br1 white bg-mid-gray">
              ${__('Settings')}
            </a>
          </div>
        </div>
        <div class="w-100 w-80-ns pa3 mb2 br0 br2-ns bg-black-05">
          <h4 class="f5 mb3 mt0">${__('No data showing up?')}</h4>
          <p>${raw(__('To use Offen with the account <strong>%s</strong> on your website, embed the following script on each page you want to appear in your statistics:', state.model.account.name))}</p>
          <pre class="pre">${raw(`&lt;script src="${window.location.origin}/script.js" data-account-id="${state.model.account.accountId}"&gt;&lt;/script&gt;`)}</pre>
        </div>
      </div>
    `
    : null

  // TODO: add properly styled loading overlay
  return html`
      <div>
        ${accountHeader}
        <div id="main">
          ${rowRangeManage}
          ${live}
          ${rowUsersSessionsChart}
          ${urlTables}
          ${retention}
          ${goSettings}
        </div>
        ${state.stale ? html`<div class="fixed top-0 right-0 bottom-0 left-0 bg-white o-40"></div>` : null}
      </div>
    `
}
