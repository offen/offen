var html = require('nanohtml')

var ALLOW = 'allow'
var DENY = 'deny'
var COOKIE_NAME = 'consent'

exports.ALLOW = ALLOW
exports.DENY = DENY

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
    path: '/'
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

exports.askForConsent = askForConsent

function askForConsent () {
  return new Promise(function (resolve) {
    var banner = html`
      <div class="roboto dark-gray bg-white absolute w-100 h-100 ph5 pv2 flex flex-column items-center justify-center">
        <div>
          <p class="mt0">
            ${__('Are you ok with us collecting usage data?')}
          </p>
          <button class="pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green mr2" onclick=${handleConsentAction(ALLOW)}>
            ${__('Accept')}
          </button>
          <button class="pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green mr2" onclick=${handleConsentAction(DENY)}>
            ${__('Decline')}
          </button>
          <a target="_blank" rel="noopener" href="https://www.offen.dev" class="f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green">
            ${__('Learn more')}
          </button>
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
