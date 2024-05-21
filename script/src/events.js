/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.pageview = pageview

function pageview (subsequent) {
  var canonicalLink = document.head.querySelector('link[rel="canonical"]')
  var canonicalHref = canonicalLink && (new window.URL(canonicalLink.getAttribute('href'), window.location.href).toString())
  var event = {
    type: 'PAGEVIEW',
    href: canonicalHref || window.location.href,
    referrer: document.referrer,
    pageload: (function () {
      if (!subsequent && window.performance && window.performance.timing) {
        return Math.round(
          window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart
        )
      }
      return null
    })(),
    // TODO: this works well at the moment, but is likely to be deprecated at
    // some point in the future. Find a more robust feature detect.
    isMobile: typeof window.onorientationchange !== 'undefined'
  }
  if (canonicalHref && canonicalHref !== window.location.href) {
    event.rawHref = window.location.href
  }
  return event
}
