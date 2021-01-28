/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const cookies = require('./cookie-tools')

const token = '__allows_cookies__'

module.exports = allowsCookies

function allowsCookies () {
  const cookie = cookies.defaultCookie('ok', token)
  document.cookie = cookies.serialize(cookie)

  const support = document.cookie.indexOf(token) >= 0

  const deletedCookie = cookies.serialize('ok', '', { expires: new Date(0) })
  document.cookie = cookies.serialize(deletedCookie)

  return support
}
