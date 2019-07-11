module.exports = allowsCookies

function allowsCookies () {
  var token = Math.random().toString(16).slice(2)
  document.cookie = 'ok=' + token
  var support = document.cookie.indexOf(token) >= 0
  document.cookie = 'ok=; expires=' + new Date(0).toUTCString()
  return support
}
