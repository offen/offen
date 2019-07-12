module.exports = hasOptedOut

function hasOptedOut () {
  return !!document.cookie && document.cookie.split(';')
    .map(function (s) {
      return s.trim()
    })
    .map(function (pair) {
      return pair.split('=')
    })
    .some(function (pair) {
      return pair[0] === 'optout'
    })
}
