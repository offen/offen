/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const cookies = require('./cookie-tools')
const consentStatus = require('./user-consent')

const COOKIE_NAME = 'onboarding-completed'

exports.get = consentStatus.withConsentGiven(getOnboardingStatus, true)

function getOnboardingStatus () {
  const values = cookies.parse(document.cookie)
  return COOKIE_NAME in values
}

exports.complete = consentStatus.withConsentGiven(setOnboardingCompleted, true)

function setOnboardingCompleted () {
  const expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  const cookie = cookies.defaultCookie(COOKIE_NAME, 'true', { expires: expires })
  document.cookie = cookies.serialize(cookie)
  return true
}
