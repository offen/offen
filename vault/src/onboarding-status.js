/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const cookies = require('./cookie-tools')
const consentStatus = require('./user-consent')

const COOKIE_NAME = 'onboarding-completed'

exports.get = getOnboardingStatus

function getOnboardingStatus () {
  var consent = consentStatus.get()
  if (consent !== 'allow') {
    return true
  }
  var values = cookies.parse(document.cookie)
  var isPreviouslySet = COOKIE_NAME in values
  if (!isPreviouslySet) {
    setOnboardingCompleted()
  }
  return isPreviouslySet
}

function setOnboardingCompleted () {
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  var cookie = cookies.defaultCookie(COOKIE_NAME, 'true', expires)
  document.cookie = cookies.serialize(cookie)
  return true
}
