/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

exports.pageview = pageview

function pageview (initial) {
  var canonicalLink = document.head.querySelector('link[rel="canonical"]')
  return {
    type: 'PAGEVIEW',
    href: (canonicalLink && canonicalLink.getAttribute('href')) || window.location.href,
    title: document.title,
    referrer: (function () {
      if (!window.URL || !document.referrer) {
        return ''
      }
      var r = new window.URL(document.referrer)
      r.search = ''
      return r.toString()
    })(),
    pageload: (function () {
      if (initial && window.performance && window.performance.timing) {
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
}
