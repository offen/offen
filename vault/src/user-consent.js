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
      return pair[0] === 'consent'
    })
    .map(function (pair) {
      return pair[1]
    })
  return matches.length ? matches[0] : null
}

exports.set = setConsentStatus

function setConsentStatus (expressConsent) {
  var status = expressConsent ? 'allow' : 'deny'
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  document.cookie = 'consent=' + status + '; expires="' + expires.toUTCString() + '"; path=/'
}
