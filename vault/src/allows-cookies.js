module.exports = allowsCookies

function allowsCookies () {
  var token = randomString()
  document.cookie = serialize({
    ok: token, SameSite: 'None', Secure: true
  })
  var support = document.cookie.indexOf(token) >= 0
  document.cookie = serialize({
    ok: '', expires: new Date(0).toUTCString(), SameSite: 'None', Secure: true
  })
  return support
}

function serialize (obj) {
  return Object.keys(obj)
    .map(function (key) {
      if (obj[key] === true) {
        return key
      }
      return key + '=' + obj[key]
    })
    .join(';')
}

function randomString () {
  return Math.random().toString(16).slice(2)
}
