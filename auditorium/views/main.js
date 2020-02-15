var html = require('choo/html')
var raw = require('choo/html/raw')
var _ = require('underscore')

var BarChart = require('./../components/bar-chart')
var Table = require('./../components/table')
var Table2 = require('./../components/table2')
var Input = require('./../components/input')

module.exports = view

function view (state, emit) {
  var userHasOptedIn = state.consentStatus && state.consentStatus.status === 'allow'

  function handleConsent () {
    var nextStatus = userHasOptedIn ? 'deny' : 'allow'
    var flashMessage = nextStatus === 'deny'
      ? __('You have successfully opted out, all usage data has been deleted')
      : __('You have now opted in.')
    emit('offen:express-consent', nextStatus, flashMessage, function (state, emitter) {
      emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
    })
  }

  function handlePurge () {
    emit('offen:purge', __('Your usage data has been deleted.'))
  }

  function handleInvite (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var invitee = formData.get('invitee')
    var emailAddress = formData.get('email-address')

    if (invitee === emailAddress) {
      state.flash = __('You cannot invite yourself')
      emit(state.events.RENDER)
      return
    }

    emit(
      'offen:invite-user',
      {
        invitee: invitee,
        emailAddress: emailAddress,
        password: formData.get('password'),
        urlTemplate: window.location.origin + '/join/{userId}/{token}/',
        accountId: state.params.accountId
      },
      __('An invite email has been sent.'),
      __('There was an error inviting the user, please try again.')
    )
  }

  var isOperator = !!(state.params && state.params.accountId)

  if (isOperator) {
    var softFailure = __(
      'This view failed to update automatically, data may be out of date. Check your network connection if the problem persists.'
    )
    emit('offen:schedule-refresh', 15000, softFailure)
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
      <a href="${url}" class="link dim dib pv2 dark-green mt1 mb2 mr3">
        ${range.display}
      </a>
    `
    return html`
      <li class="bt b--light-gray">
        ${activeRange
    ? html`
      <a href="${url}" class="b link dim dib bt bw2 b--dark-green pv2 mb2 mr3 dark-green">
        ${range.display}
      </a>
    `
    : anchorRange
}
      </li>
    `
  })

  var rangeSelector = html`
    <h4 class ="f4 normal mt0 mb3">${__('Show data from the last')}</h4>
    <ul class="flex flex-wrap list pa0 ma0 mb3">${ranges}</ul>
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
          buttonClass = 'b link dim dib bt bw2 b--mid-gray pv2 mb2 mr3 mid-gray'
        } else {
          buttonClass = 'link dim dib pv2 mt1 mb2 mr3 mid-gray'
        }
        return html`
          <li class="bt b--moon-gray">
            <a href="/auditorium/${account.accountId}/" class="${buttonClass}">
              ${account.accountName}
            </a>
          </li>
        `
      })
    manage = html`
      <div class="flex justify-between">
        <h4 class ="f4 normal mt0 mb3">Choose account</h4>
        <a role="button" class="dib dn-ns label-toggle label-toggle--rotate"></a>
      </div>
      <ul class="flex flex-wrap list pa0 ma0 mb3">
        ${availableAccounts}
      </ul>
    `
  } else {
    var deleteButton = null
    if (userHasOptedIn) {
      deleteButton = html`
        <p class="ma0 mb3">
          ${raw(__('Delete only my <strong>usage data</strong>'))}
        </p>
        <button class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mr1 dib br1 white bg-mid-gray" data-role="purge" onclick="${handlePurge}">
          ${raw(__('<strong>Delete</strong>'))}
        </button>
      `
    }
    manage = html`
      <h4 class="f4 normal mt0 mb3">${__('Privacy')}</h4>
      <div class="flex flex-column flex-row-ns">
        <div class="w-100 w-50-m w-40-l bn br-ns b--moon-gray mb4 mb0-ns mr0 mr4-ns">
          ${deleteButton}
        </div>
        <div class="w-100 w-50-m w-60-l bt bn-ns b--moon-gray mb4">
          <p class="ma0 mt3 mt0-ns mb3">
            ${userHasOptedIn ? raw(__('Opt out and delete my <strong>usage data</strong>')) : raw(__('Opt in and grant access to your <strong>usage data</strong>'))}
          </p>
          <button class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 dib br1 white bg-mid-gray" data-role="consent" onclick=${handleConsent}>
            ${userHasOptedIn ? __('Opt out and delete') : __('Opt in')}
          </button>
        </div>
      </div>
    `
  }

  if (isOperator) {
    var rowRangeManage = html`
      <div class="flex flex-column flex-row-ns mt4">
        <div class="w-100 w-40-ns br0 br2-ns pa3 mb2 mr2-ns bg-black-05">
          ${manage}
        </div>
        <div class="w-100 w-60-ns bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns bg-white">
          ${rangeSelector}
        </div>
      </div>
    `
  } else {
    var rowRangeManage = html`
      <div class="flex flex-column mt4">
        <div class="w-100 br0 br2-ns pa3 mb2 mr2-ns bg-black-05">
          ${manage}
        </div>
        <div class="w-100 bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns bg-white">
          ${rangeSelector}
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
    <div class="flex flex-column w-100 w-70-m w-75-l bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns mr2-ns bg-white ">
      <h4 class="f4 normal mt0 mb3">
        ${__('Page views and %s', isOperator ? __('visitors') : __('accounts'))}
      </h4>
      ${state.cache(BarChart, 'main/bar-chart').render(chartData)}
    </div>
  `

  var uniqueEntities = isOperator
    ? state.model.uniqueUsers
    : state.model.uniqueAccounts
  var entityName = isOperator
    ? __('users')
    : __('accounts')

  var uniqueSessions = state.model.uniqueSessions
  var keyMetrics = html`
    <div class="w-100 w-30-m w-25-l bt ba-ns br0 br2-ns b--black-10 pa3 mb2-ns bg-white">
      <h4 class ="f4 normal mt0 mb3">Key metrics</h4>
      <div class="flex flex-wrap">
        ${keyMetric(__('Unique %s', entityName), formatCount(uniqueEntities))}
        ${keyMetric(__('Unique sessions'), formatCount(uniqueSessions))}
        <hr style="border: 0; height: 1px;" class="w-100 mt0 mb3 bg-light-gray">
        ${state.model.avgPageDepth ? keyMetricSmall(__('Avg. page depth'), formatNumber(state.model.avgPageDepth)) : null}
        ${keyMetricSmall(__('Bounce rate'), `${formatNumber(state.model.bounceRate, 100)} %`)}
        ${isOperator && state.model.loss ? keyMetricSmall(__('Plus'), `${formatNumber(state.model.loss, 100)} %`) : null}
        <hr style="border: 0; height: 1px;" class="w-100 mt0 mb3 bg-light-gray">
        ${keyMetricSmall(__('Mobile users'), `${formatNumber(state.model.mobileShare, 100)} %`)}
        ${state.model.avgPageload ? keyMetricSmall(__('Avg. page load time'), formatDuration(state.model.avgPageload)) : null}
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
    { headline: __('General'), col1Label: __('URL'), col2Label: __('Pageviews'), rows: state.model.pages }
  ]
  var referrersTableData = [
    { headline: __('Referrers'), col1Label: __('Host'), col2Label: __('Pageviews'), rows: state.model.referrers },
    { headline: __('Campaigns'), col1Label: __('Campaign'), col2Label: __('Pageviews'), rows: state.model.campaigns },
    { headline: __('Sources'), col1Label: __('Source'), col2Label: __('Pageviews'), rows: state.model.sources }
  ]
  var landingExitTableData = [
    { headline: __('Landing pages'), col1Label: __('URL'), col2Label: __('Landings'), rows: state.model.landingPages },
    { headline: __('Exit pages'), col1Label: __('URL'), col2Label: __('Exits'), rows: state.model.exitPages }
  ]
  var urlTables = html`

    <div class="w-100 bt ba-ns br0 br2-ns b--black-10 pa3 mb2-ns bg-white">
      <h4 class ="f4 normal mt0 mb3">Top pages</h4>
      ${state.cache(Table, 'main/pages-table').render(pagesTableData, __('No data available for this view'))}
      ${state.cache(Table, 'main/landing-exit-table').render(landingExitTableData, __('No data available for this view'))}
      ${state.cache(Table, 'main/referrers-table').render(referrersTableData, __('No data available for this view'))}
    </div>
  `

  var retention = html`
    <div class="w-100 pa3 bt ba-ns br0 br2-ns b--black-10 mb2-ns bg-white">
      <h4 class ="f4 normal mt0 mb3">Weekly retention</h4>
      ${retentionTable(state.model.retentionMatrix)}
    </div>
  `

    var live = null
    if (isOperator) {
      var tableData = { headline: __('Active pages'), col1Label: __('URL'), col2Label: __('Visitors'), rows: state.model.livePages }
      live = html`
        <div class="flex flex-column w-100 bb bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns mr2-ns bg-white">
          <div class="flex flex-column flex-row-ns">
            <div class="w-100 w-30-m w-20-l bn br-ns b--light-gray mr4">
              <h4 class="f4 normal ma0 mb4">
                ${__('Real time')}
              </h4>
              ${keyMetric('Active users on site', state.model.liveUsers)}
            </div>
            <div class="w-100 w-70-m w-80-l bt bn-ns b--light-gray">
              ${state.cache(Table2, 'main/live-table').render([tableData], __('No data available for this view'))}
            </div>
          </div>
        </div>
      `
    }

  var embedCode = isOperator
    ? html`
      <div class="flex flex-column flex-row-ns mt2">
        <div class="w-100 br0 br2-ns pa3 mb2 bg-black-05">
          <div class="flex flex-wrap justify-between">
            <h4 class="f4 normal mt0 mb3">${__('Embed code')}</h4>
            <a role="button" class="dib label-toggle label-toggle--rotate"></a>
          </div>
          <div class="mw6 center mb4">
            <p class="ma0 mb3">
              ${raw(__('To use Offen with the account <strong>%s</strong> on your website, embed the following script on each page you want to appear in your statistics.', state.model.account.name))}
            </p>
            <div class="w-100 overflow-hidden br1 ba b--moon-gray">
              <div class="h2 overflow-y-hidden overflow-x-scroll bg-light-yellow " style="margin-bottom: -50px; padding-bottom: 50px; box-sizing: content-box;">
                <p class="nowrap ma0 ph2 pt2">
                  ${raw(`&lt;script async src="${window.location.origin}/script.js" data-account-id="${state.model.account.accountId}"&gt;&lt;/script&gt;`)}
                </p>
              </div>
            </div>
            <a href="#" class="pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mt3 white bg-mid-gray">
              ${__('Copy code')}
            </a>
          </div>
        </div>
      </div>
    `
    : null

  var invite = null
  if (isOperator) {
    invite = html`
      <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05">
        <div class="flex justify-between">
          <h4 class="f4 normal mt0 mb3">${__('Share account')}</h4>
          <a role="button" class="dib label-toggle label-toggle--rotate"></a>
        </div>
        <form class="mw6 center mb4" onsubmit="${handleInvite}">
          <p class="ma0 mb3">
          ${raw(__('Share your Offen account <strong>%s</strong> via email invitation. Invited users can view data and modify your account.', state.model.account.name))}
          </p>
          <label class="lh-copy">
            ${__('Email address to send invite to')}
            ${state.cache(Input, 'main/invite-user-invitee', { type: 'email', name: 'invitee' }).render()}
          </label>
          <hr style="border: 0; height: 1px;" class="w-100 mt3 mb2 bg-moon-gray">
          <h5 class="f5 normal ma0 mb3 silver">${__('Confirm with your credentials')}</h5>
          <label class="lh-copy" id="invite-single-email">
            ${__('Your email address')}
            ${state.cache(Input, 'main/invite-user-email', { type: 'email', name: 'email-address' }).render()}
          </label>
          <label class="lh-copy" id="invite-single-password">
            ${__('Your password')}
            ${state.cache(Input, 'main/invite-user-password', { type: 'password', name: 'password' }).render()}
          </label>
          <input class="pointer w-100 w-auto-ns f5 link dim bn dib br1 ph3 pv2 white bg-mid-gray" type="submit" value="${__('Invite user')}">
        </form>
      </div>
    `
  }

  var goSettings = isOperator
    ? html`
      <div class="w-100 w-100-ns br0 br2-ns pa3 mt2 bg-black-05">
        <div class="flex justify-between">
          <h4 class ="f4 normal mt0 mb3">${__('Admin console')}</h4>
          <a role="button" class="dib label-toggle label-toggle--rotate"></a>
        </div>
        <div class="mw6 center mb4">
          <div class="flex flex-column flex-row-ns justify-between">
            <div class="flex flex-column flex-row-ns w-100 w-auto-ns">
              <a href="/console#share-all-accounts" class="w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mr0 mr2-ns mb3 mb0-ns white bg-mid-gray">
                ${__('Share all accounts')}
              </a>
              <a href="/console#create-new-account" class="w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mb4 mb0-ns white bg-mid-gray">
                ${__('Manage accounts')}
              </a>
            </div>
            <div class="w-100 w-auto-ns tr-ns">
              <a href="/console/" class="w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 white bg-silver">
                ${__('Logout')}
              </a>
            </div>
          </div>
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
          ${rowUsersSessionsChart}
          ${urlTables}
          ${retention}
          ${live}
          ${embedCode}
          ${invite}
          ${goSettings}

        </div>
        ${state.stale ? html`<div class="fixed top-0 right-0 bottom-0 left-0 bg-white o-40"></div>` : null}
      </div>
    `
}

function keyMetric (name, value) {
  return html`
      <div class="w-50 w-100-ns mb4">
        <p class="mv0 f2">${value}</p>
        <p class="mv0 normal">${name}</p>
      </div>
    `
}

function keyMetricSmall (name, value) {
  return html`
      <div class="w-50 w-100-ns mb4">
        <p class="mv0 f3">${value}</p>
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
        class="${value !== 0 ? 'bg-dark-green' : 'bg-near-white'} h3 w-100"
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
    <table class="w-100 collapse mb4 dt--fixed">
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

function formatDuration (valueInMs) {
  if (valueInMs >= 1000) {
    return formatNumber(valueInMs / 1000, 1, 2) + __('s')
  }
  return Math.round(valueInMs) + __(' ms')
}

function formatCount (count) {
  if (count > 1000000) {
    return formatNumber(count / 1000000) + __('M')
  }
  if (count > 1000) {
    return formatNumber(count / 1000) + __('k')
  }
  return count
}

function formatNumber (value, factor, digits) {
  return (value * (factor || 1)).toLocaleString(process.env.LOCALE, {
    maximumFractionDigits: digits || 1,
    minimumFractionDigits: digits || 1
  })
}
