var html = require('nanohtml')

var ALLOW = 'allow'
var DENY = 'deny'
var COOKIE_NAME = 'consent'

exports.ALLOW = ALLOW
exports.DENY = DENY

exports.askForConsent = askForConsent

function askForConsent (styleHost) {
  return new Promise(function (resolve) {
    var isCollapsed = false
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

    function handleCollapseAction () {
      isCollapsed = !isCollapsed
      render()
    }

    function makeConsentActionHandler (result) {
      return function () {
        styleHost({
          styles: hostStylesHidden(styleHost.selector).innerHTML
        })
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild)
        }
        window.removeEventListener('resize', onResize)
        resolve(result)
      }
    }

    function onResize (event) {
      adjustHostStyles()
    }

    function adjustHostStyles (styles) {
      stylesReady.then(function () {
        styleHost({
          attributes: {
            height: document.body.clientHeight
          },
          styles: styles
        })
      })
    }

    function render () {
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild)
      }
      var banner = bannerView(
        isCollapsed,
        handleCollapseAction,
        makeConsentActionHandler(ALLOW),
        makeConsentActionHandler(DENY)
      )
      document.body.appendChild(banner)
      adjustHostStyles(
        hostStylesVisible(styleHost.selector, isCollapsed).innerHTML
      )
    }
  })
}

function bannerView (collapsed, handleCollapseAction, handleAllow, handleDeny) {
  var containerClass = 'roboto pa3'
  var toggleClass = 'fr pointer gray dim label-toggle'
  if (collapsed) {
    containerClass += ' collapse'
    toggleClass += ' label-toggle--rotate'
  }

  var learnMore = html`
    <a target="_blank" rel="noopener" href="/" class="normal link underline dim dark-gray">
      ${__('Learn more')}
    </a>
  `
  return html`
    <div class="${containerClass}">
      <p class="b mt0 mb3">
        ${__('Continue with transparent analytics')}
        ${collapsed ? learnMore : null}
        <a role="button" class="${toggleClass}" onclick="${handleCollapseAction}"></a>
      </p>
      ${!collapsed ? html`
        <p class="mt0 mb3">
          ${__('Help us to make this website better by granting access to your usage data. Your data always remains yours. Review and delete it at any time.')}
          ${learnMore}
        </p>
      ` : null}
      <div class="flex">
        <div class="w-50 mr2">
          <button class="w-100 pointer tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleAllow}>
            ${__('Yes Please')}
          </button>
        </div>
        <div class="w-50 ml2">
          <button class="w-100 pointer tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleDeny}>
            ${__('I Do Not Allow')}
          </button>
        </div>
      </div>
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
      @media all and (max-width: 430px) {
        body {
          font-size: .75rem;
        }
      }
      @media all and (max-width: 340px) {
        body {
          font-size: .65rem;
        }
      }
    </style>
  `
}

function hostStylesVisible (selector, isCollapsed) {
  var bottom = isCollapsed ? '-1px' : '138px'
  return html`
<style>
  ${selector} {
    display: block !important;
    position: fixed;
    bottom: ${bottom};
    right: 0;
    left: 0;
    margin: 0 auto;
    width: 450px;
    border: 1px solid #8a8a8a;
    border-radius: 3px;
    background-color: #FFFDF4;
    box-shadow: 0px 0px 9px 0px rgba(0,0,0,0.50);
  }
  @media all and (max-width: 480px) {
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
  var matches = document.cookie.split(';')
    .map(function (s) {
      return s.trim()
    })
    .map(function (pair) {
      return pair.split('=')
    })
    .filter(function (pair) {
      return pair[0] === COOKIE_NAME
    })
    .map(function (pair) {
      return pair[1]
    })
  return matches.length ? matches[0] : null
}

exports.set = setConsentStatus

function setConsentStatus (status) {
  var isLocalhost = window.location.hostname === 'localhost'
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  var cookie = {
    consent: status,
    expires: expires.toUTCString(),
    path: '/',
    SameSite: isLocalhost ? 'Lax' : 'None',
    Secure: !isLocalhost
  }
  document.cookie = serialize(cookie)
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
      return [key, '=', obj[key]].join('')
    })
    .filter(Boolean)
    .join(';')
}
