var html = require('nanohtml')

var ALLOW = 'allow'
var DENY = 'deny'
var COOKIE_NAME = 'consent'

exports.ALLOW = ALLOW
exports.DENY = DENY

exports.askForConsent = askForConsent

function askForConsent () {
  return new Promise(function (resolve) {
    var banner = html`
      <div class="w-100 h-100 absolute roboto f5 lh-copy dark-gray bg-white">
        <div class="ma4-ns ma3">
          <p class="mt0 mb3 b">
            ${__('Continue with transparent analytics')}
          </p>
          <p class="mt0 mb4">
            ${__('Help us to make this website better by granting access to your usage data. Your data always remains yours. Review and delete it at any time.')}
            <a target="_blank" rel="noopener" href="https://www.offen.dev" class="link underline dim dark-gray ">
              ${__('Learn more')}
            </a>
          </p>
          <div class="flex pb5">
            <div class="w-50 mr2">
              <button class="w-100 pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleConsentAction(ALLOW)}>
                ${__('Yes Please')}
              </button>
            </div>
            <div class="w-50 ml2">
              <button class="w-100 pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleConsentAction(DENY)}>
                ${__('I Do Not Allow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    var styleSheet = html`
      <link rel="stylesheet" href="/tachyons.min.css">
      <link rel="stylesheet" href="/fonts.css">
    `
    document.head.appendChild(styleSheet)
    document.body.appendChild(banner)

    function handleConsentAction (result) {
      return function () {
        resolve(result)
        document.body.removeChild(banner)
      }
    }
  })
}

exports.hostStyles = hostStyles

function hostStyles (selector) {
  return {
    visible: html`
<style>
  ${selector} {
    display: block !important;
    position: fixed;
    top: 50vh;
    right: 0;
    left: 0;
    margin: 0 auto;
    height: 220px;
    width: 450px;
  }
  @media all and (max-width: 480px) {
    ${selector} {
      height: 250px;
      width: 92vw;
    }
  }
</style>`,
    hidden: html`
<style>
  ${selector} {
    display: none;
  }
</style>`
  }
}

exports.get = getConsentStatus

function getConsentStatus () {
  var matches = document.cookie.split(';')
    .map(function (s) {
      return s.trim()
    })
    .map(function (pair) {
      return pair.split('=')
    })
    .filter(function (pair) {
      return pair[0] === COOKIE_NAME
    })
    .map(function (pair) {
      return pair[1]
    })
  return matches.length ? matches[0] : null
}

exports.set = setConsentStatus

function setConsentStatus (status) {
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  var cookie = {
    consent: status,
    expires: expires.toUTCString(),
    path: '/',
    SameSite: 'Lax'
  }
  document.cookie = serialize(cookie)
}

function serialize (obj) {
  return Object.keys(obj)
    .map(function (key) {
      return [key, '=', obj[key]].join('')
    })
    .join(';')
}
