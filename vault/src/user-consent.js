/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var html = require('nanohtml')
var raw = require('nanohtml/raw')

var cookies = require('./cookie-tools')

var ALLOW = 'allow'
var DENY = 'deny'
var COOKIE_NAME = 'consent'

exports.ALLOW = ALLOW
exports.DENY = DENY

exports.askForConsent = askForConsent

function askForConsent (styleHost) {
  return new Promise(function (resolve) {
    var consentGiven = false
    var stylesReady = new Promise(function (resolve) {
      var styleSheet = html`
        <link rel="stylesheet" href="/fonts.css" onload={resolve}>
        ${bannerStyles()}
      `
      document.head.appendChild(styleSheet)
      resolve()
    })

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
        styles: hostStylesHidden(styleHost.selector).innerHTML
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
          height: height || document.body.clientHeight
        },
        styles: styles
      })
    }

    function render () {
      var host = document.body.querySelector('#host')
      stylesReady.then(function () {
        var banner = bannerView(
          consentGiven,
          allowHandler,
          denyHandler,
          closeHandler
        )
        if (host.firstChild) {
          var current = host.firstChild
          host.insertBefore(banner, current)
          adjustHostStyles(
            hostStylesVisible(styleHost.selector).innerHTML,
            banner.getBoundingClientRect().height
          )
          host.removeChild(current)
        } else {
          host.appendChild(banner)
          adjustHostStyles(
            hostStylesVisible(styleHost.selector).innerHTML,
            banner.getBoundingClientRect().height
          )
        }
      })
    }
  })
}

function bannerView (consentGiven, handleAllow, handleDeny, handleClose) {
  var content
  if (consentGiven) {
    content = html`
      <p>
        ${raw(__('Thanks for your help to make this website better.'))}
      </p>
      <p>
        ${raw(__('To manage your usage data <a target="_blank" rel="noopener" href="%s">open the Auditorium.</a>', '/auditorium/'))}
      </p>
      <div>
        <button onclick="${handleClose}">
          ${__('Continue')}
        </button>
      </div>
    `
  } else {
    content = html`
      <p>
        ${__('We only access usage data with your consent.')}
      </p>
      <p>
        ${__('You can opt out and delete any time.')}
        <a target="_blank" rel="noopener" href="/">
          ${__('Learn more')}
        </a>
      </p>
      <div>
        <button onclick=${handleAllow}>
          ${__('I allow')}
        </button>
        <button onclick=${handleDeny}>
          ${__('I don\'t allow')}
        </button>
      </div>
    `
  }

  return html`
    <div>
      ${content}
    </div>
  `
}

function bannerStyles () {
  return html`
    <style>
      body {
        margin: 0;
        padding: 8px;
      }
    </style>
  `
}

function hostStylesVisible (selector) {
  return html`
<style>
  ${selector} {
    display: block !important;
    position: fixed;
    bottom: 138px;
    right: 0;
    left: 0;
    margin: 0 auto;
    box-shadow: 0px 0px 9px 0px rgba(0,0,0,0.50);
    z-index: 2147483647;
  }
  @media all and (max-width: 414px) {
    ${selector} {
      width: 100%;
      border-left: none;
      border-right: none;
      border-radius: 0;
    }
  }
</style>
  `
}

function hostStylesHidden (selector) {
  return html`
<style>
  ${selector} {
    display: none;
  }
</style>
  `
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
