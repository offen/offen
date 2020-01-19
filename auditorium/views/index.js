var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = function (state, emit) {
  function handleConsent (status) {
    return function () {
      emit('offen:express-consent', status, function () {
        emit(state.events.RENDER)
      })
    }
  }

  var allowsCookies = state.consentStatus && state.consentStatus.allowsCookies
  var consentStatus = state.consentStatus && state.consentStatus.status

  var consentStatusDisplay = null
  if (consentStatus) {
    var text = consentStatus === 'allow'
      ? __('You are <strong>opted in</strong>.')
      : __('You are <strong>opted out</strong>.')
    consentStatusDisplay = html`
      <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns bg-light-yellow">
        ${raw(text)}
      </p>
    `
  }

  var mainQuestion = null
  if (consentStatus == 'allow') {
    mainQuestion = html`
      <p class="b mt0 mb1">
        ${__('How can I review and delete my usage data or opt out?')}
      </p>
      <p class="mt0 mb4">
        ${raw(__('Go to the <a href="%s" class="%s">Auditorium.</a>', '/auditorium/', 'normal link underline dim dark-gray'))}
      </p>
      `
  } else {
    mainQuestion = html`
      <p class="b mt0 mb1">
        ${__('How can I review and delete my usage data?')}
      </p>
      <p class="mt0 mb4">
        ${raw(__('For data to be collected you need to opt in first. You can do this in the <a href="%s" class="%s">consent banner.</a>', '#consentBanner', 'normal link underline dim dark-gray'))}
      </p>
      `
  }
  
  var mainCard = null
  if (allowsCookies) {
    mainCard = html`
      <div class="w-100 ph3 ph4-ns pv4 mb2 br0 br2-ns bg-black-05">
        <div class="flex flex-column flex-row-ns w-100">
          <div class="w-100 w-50-ns mr2-ns">
            ${mainQuestion}
            <p class="b mt0 mb1">
              ${__('What data is collected?')}
            </p>
            <p class="mt0 mb4">
              ${__('Only page views, sessions, referrer and visited URL are collected. From this, other metrics such as the bounce rate are calculated.')}
            </p>
            <p class="b mt0 mb1">
              ${__("What data isn't collected?")}
            </p>
            <p class="mt0 mb4">
              ${__('Location data, device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
            </p>
            <p class="b mt0 mb1">
              ${__('How is my data handled?')}
            </p>
            <p class="mt0 mb4">
              ${__('Your data is encrypted end-to-end. It will be deleted after 6 months at the latest. Offen does not share your data with third-parties.')}
            </p>
          </div>
          <div class="w-100 w-50-ns ml4-ns">
            <p class="b mt0 mb1">
              ${__('Why do I need to opt in or opt out?')}
            </p>
            <p class="mt0 mb4">
              ${__('Our banner serves two purposes: We ask you to access your usage data and would like to obtain your consent for its use.')}
            </p>
            <p class="b mt0 mb1">
              ${__('Do you use cookies?')}
            </p>
            <p class="mt0 mb4">
              ${__('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use cookies to store a user and a session ID for you.')}
            </p>
            <p class="b mt0 mb1">
              ${__('How does it all work?')}
            </p>
            <p class="mt0 mb1">
              ${__('After opening a website that has offen installed you can explicitly opt in to the data collection and thereby help to improve the services you use.')}
            </p>
            <p class="mt0 mb1">
              ${raw(__('Only then you will be assigned a user and a session ID using a cookie. Learn more about cookies <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank">here.</a>', 'normal link underline dim dark-gray'))}
            </p>
            <p class="mt0 mb4">
              ${__('Offen handles these IDs in an unrecognizable form. Operators can identify you only within one website.')}
            </p>
          </div>
        </div>
      </div>
      <div class="flex flex-column flex-row-ns items-center w-100 ph3 ph4-ns pv4 br0 br2-ns bg-black-05">
        <div class="w-100 w-60-ns mr3-ns mb3 mb0-ns">
          <h3 class="f5 tc tl-ns normal mt0 mb0">
            ${__('Are you the operator of this Offen installation? Log in to your account.')}
          </h3>
        </div>
        <div class="w-100 w-40-ns tc">
          <a href="/login/" class="f5 tc link dim bn ph3 pv2 dib br1 white bg-mid-gray">
            ${__('Log in as operator')}
          </a>
        </div>
      </div>
    `
  }
  
  

  var headerCard = null
  if (!allowsCookies) {
    headerCard = noCookiesBox()
  } else if (!consentStatus) {
    headerCard = consentBox(handleConsent('allow'), handleConsent('deny'))
  } else if (consentStatus === 'deny') {
    headerCard = consentBox(handleConsent('allow'))
  } else if (consentStatus === 'allow') {
    headerCard = auditoriumBox()
  }

  return html`
    ${consentStatusDisplay}
    ${wrapCard(headerCard)}
    ${mainCard}
  `
}

function wrapCard (content) {
  return html`
    <div class="flex flex-column flex-row-ns items-center w-100 ph3 ph4-ns pv4 mt4 mb2 bt bb ba-ns br0 br2-ns b--black-10 bg-white">
      ${content}
    </div>
  `
}

function consentBox (handleAllow, handleDeny) {
  return html`
    <div class="w-100 w-60-ns mr3-ns" id="consentBanner">
      <h3 class="f5 b tl-ns ma0 mb2">
        ${__('Continue with transparent analytics')}
      </h3>
      <p class="ma0 mb2">
        ${__('Offen is a fair and open source analytics software. Help the website that linked you here by granting access to your usage data.')}
      </p>
      <p class="ma0 mb2 mb0-ns">
        ${__('Your data always remains yours. You can review and delete it at any time. Opt out again whenever you want.')}
      </p>
    </div>
    <div class="w-100 w-40-ns tc mt2 mt0-ns">
      <button class="pointer f5 tc link dim bn ph3 pv2 dib br1 mr3 white bg-dark-gray" onclick="${handleAllow}">
        ${__('Yes Please')}
      </button>
      <button disabled=${!handleDeny} class="f5 tc link dim bn ph3 pv2 dib br1 white ${handleDeny ? 'bg-dark-gray pointer' : 'bg-light-gray'}" onclick="${handleDeny}">
        ${__('I Do Not Allow')}
      </button>
    </div>
  `
}

function noCookiesBox () {
  return html`
    <div class="w-100 w-70-ns mr3-ns">
      <p>
        ${__('Enable cookies in your browser to use Offen.')}
      </p>
    </div>
  `
}

function auditoriumBox () {
  return html`
    <div class="w-100 w-70-ns mr3-ns">
      <h3 class="f5 b tc tl-ns mt0 mb0">
        ${__('Manage the usage data that has been collected from you.')}
      </h3>
    </div>
    <div class="w-100 w-30-ns tc mt2 mt0-ns">
      <a href="/auditorium/" class="f5 tc link dim bn ph3 pv2 dib br1 white bg-dark-green">
        ${__('Open Auditorium')}
      </a>
    </div>
  `
}
