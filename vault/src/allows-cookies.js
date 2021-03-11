/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var cookies = require('./cookie-tools')

var token = '__allows_cookies__'

module.exports = allowsCookies

function allowsCookies () {
  var cookie = cookies.defaultCookie('ok', token)
  document.cookie = cookies.serialize(cookie)

  var support = document.cookie.indexOf(token) >= 0

  var deletedCookie = cookies.defaultCookie('ok', '', { expires: new Date(0) })
  document.cookie = cookies.serialize(deletedCookie)

  return support
}
