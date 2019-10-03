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
      <div>
        <p>Are you ok with us collecting usage data?</p>
        <button onclick=${handleConsentAction(ALLOW)}>Accept</button>
        <button onclick=${handleConsentAction(DENY)}>Decline</button>
      </div>
    `
    document.body.appendChild(banner)

    function handleConsentAction (result) {
      return function () {
        resolve(result)
        document.body.removeChild(banner)
      }
    }
  })
}
