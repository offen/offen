/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
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
        <link rel="stylesheet" href="/fonts.css">
        <link rel="stylesheet" href="/tachyons.min.css" onload="${resolve}">
        ${bannerStyles()}
      `
      document.head.appendChild(styleSheet)
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
            hostStylesVisible(styleHost.selector).innerHTML
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
      <p class="tc mt0 mb2">
        ${raw(__('Thanks for your help to make this website better.'))}
      </p>
      <p class="tc mt0 mb3">
        ${raw(__('To manage your usage data <a class="b normal link dim dark-gray" target="_blank" rel="noopener" href="%s">open the Auditorium.</a>', '/auditorium/'))}
      </p>
      <div class="w-100 flex">
        <button class="db w-40 center pointer tc dim bn ph3 pv2 dib br1 white bg-mid-gray" onclick="${handleClose}">
          ${__('Continue')}
        </button>
      </div>
    `
  } else {
    var learnMore = html`
      <a target="_blank" rel="noopener" href="/" class="b normal link dim dark-gray">
        ${__('Learn more')}
      </a>
    `
    content = html`
      <p class="tc ma0 mb2">
        ${__('We only access usage data with your consent.')}
      </p>
      <p class="tc ma0 mb3">
      ${__('You can opt out and delete any time.')}
      ${learnMore}
      </p>
      <div class="flex">
        <div class="w-50 mr2">
          <button class="w-100 pointer tc dim bn ph3 pv2 dib br1 white bg-mid-gray" onclick=${handleAllow}>
            ${__('I allow')}
          </button>
        </div>
        <div class="w-50 ml2">
          <button class="w-100 pointer tc dim bn ph3 pv2 dib br1 white bg-mid-gray" onclick=${handleDeny}>
            ${__('I don\'t allow')}
          </button>
        </div>
      </div>
    `
  }

  return html`
    <div class="roboto pa3">
      ${content}
    </div>
  `
}

function bannerStyles () {
  return html`
    <style>
      .label-toggle::after {
        border-style: solid;
        border-width: 0.15em 0.15em 0 0;
        content: '';
        display: inline-block;
        height: 0.45em;
        left: 0.15em;
        position: relative;
        top: 0.15em;
        transform: rotate(135deg);
        vertical-align: top;
        width: 0.45em;
        margin-top: -0.2em;
        margin-left: -1.2em;
      }
      .label-toggle.label-toggle--rotate::after {
        top: 0;
        transform: rotate(-45deg);
        margin-top: 0.4em;
      }
      body {
        font-size: 1rem;
      }
      @media all and (max-width: 389px) {
        body {
          font-size: .75rem;
        }
      }
      @media all and (max-width: 289px) {
        body {
          font-size: .65rem;
        }
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
    width: 410px;
    border: 1px solid #8a8a8a;
    border-radius: 3px;
    background-color: #FFFDF4;
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
  var cookie = cookies.defaultCookie(COOKIE_NAME, status, expires)
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
