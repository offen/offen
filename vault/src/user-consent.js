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
          styles: hostStylesHidden(styleHost.selector).hidden.innerHTML
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
  var containerClass = 'roboto f5-ns f6 shadow-2 bg-white pa3'
  var toggleClass = 'fr pointer gray dim label-toggle'
  if (collapsed) {
    containerClass += ' collapse'
    toggleClass += ' label-toggle--rotate'
  }

  var learnMore = html`
    <a target="_blank" rel="noopener" href="https://www.offen.dev" class="normal link underline dim dark-gray">
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
          <button class="w-100 pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleAllow}>
            ${__('Yes Please')}
          </button>
        </div>
        <div class="w-50 ml2">
          <button class="w-100 pointer f5 tc dim bn ph3 pv2 dib br1 white bg-dark-gray" onclick=${handleDeny}>
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
        content: ' ';
        display: inline-block;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 8px solid currentColor;
        vertical-align: middle;
        transform: rotate(90deg);
        margin-right: 8px;
      }
      .label-toggle.label-toggle--rotate::after {
        transform: rotate(-90deg);
      }
    </style>
  `
}

function hostStylesVisible (selector, isCollapsed) {
  var bottom = isCollapsed ? '0px' : '138px'
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
  }
  @media all and (max-width: 480px) {
    ${selector} {
      width: 100%;
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
  var expires = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
  var cookie = {
    consent: status,
    expires: expires.toUTCString(),
    path: '/',
    SameSite: 'Lax'
  }
  document.cookie = serialize(cookie)
}

function serialize (obj) {
  return Object.keys(obj)
    .map(function (key) {
      return [key, '=', obj[key]].join('')
    })
    .join(';')
}
