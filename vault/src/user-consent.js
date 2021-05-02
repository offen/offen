/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var cookies = require('./cookie-tools')

var consentBanner = require('offen/consent-banner')

var ALLOW = 'allow'
var DENY = 'deny'
var COOKIE_NAME = 'consent'

exports.ALLOW = ALLOW
exports.DENY = DENY

exports.askForConsent = askForConsent

function askForConsent (styleHost) {
  return new Promise(function (resolve) {
    var consentGiven = false

    window.addEventListener('resize', onResize)
    render()

    function allowHandler () {
      consentGiven = true
      render()
      resolve(ALLOW)
    }

    function denyHandler () {
      closeHandler()
      resolve(DENY)
    }

    function closeHandler () {
      styleHost({
        styles: consentBanner.hostStylesHidden({ selector: styleHost.selector }).innerHTML
      })
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild)
      }
      window.removeEventListener('resize', onResize)
    }

    function onResize (event) {
      adjustHostStyles()
    }

    function adjustHostStyles (styles, height) {
      styleHost({
        attributes: {
          height: document.body.clientHeight
        },
        styles: styles
      })
    }

    function render () {
      var host = document.body.querySelector('#host')
      var banner = consentBanner.bannerView({
        consentGiven: consentGiven,
        handleAllow: allowHandler,
        handleDeny: denyHandler,
        handleClose: closeHandler
      })
      if (host.firstChild) {
        var current = host.firstChild
        host.insertBefore(banner, current)
        host.removeChild(current)
        adjustHostStyles(
          consentBanner.hostStylesVisible({ selector: styleHost.selector }).innerHTML
        )
      } else {
        host.appendChild(banner)
        adjustHostStyles(
          consentBanner.hostStylesVisible({ selector: styleHost.selector }).innerHTML
        )
      }
    }
  })
}

exports.get = getConsentStatus

function getConsentStatus () {
  var matches = cookies.parse(document.cookie)
  return matches[COOKIE_NAME] || null
}

exports.set = setConsentStatus

function setConsentStatus (status) {
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  var cookie = cookies.defaultCookie(COOKIE_NAME, status, { expires: expires })
  document.cookie = cookies.serialize(cookie)
}

exports.withConsentGiven = withConsentGiven

function withConsentGiven (fn, returnVal) {
  return function () {
    var args = [].slice.call(arguments)
    var consent = getConsentStatus()
    if (consent !== ALLOW) {
      return returnVal
    }
    return fn.apply(null, args)
  }
}
