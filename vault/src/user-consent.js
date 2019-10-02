module.exports = consentStatus

function consentStatus () {
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
