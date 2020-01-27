module.exports = allowsCookies

function allowsCookies () {
  var isLocalhost = window.location.hostname === 'localhost'
  var sameSite = isLocalhost ? 'Lax' : 'None'
  var token = randomString()
  document.cookie = serialize({
    ok: token, SameSite: sameSite, Secure: !isLocalhost
  })
  var support = document.cookie.indexOf(token) >= 0
  document.cookie = serialize({
    ok: '', expires: new Date(0).toUTCString(), SameSite: sameSite, Secure: !isLocalhost
  })
  return support
}

function serialize (obj) {
  return Object.keys(obj)
    .map(function (key) {
      if (obj[key] === true) {
        return key
      }
      if (obj[key] === false) {
        return null
      }
      return key + '=' + obj[key]
    })
    .filter(Boolean)
    .join(';')
}

function randomString () {
  return Math.random().toString(16).slice(2)
}
