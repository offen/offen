/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-check

exports.pageview = pageview

/**
 *
 * @typedef {Object} EventType
 * @property {'PAGEVIEW'} type
 * @property {string} href
 * @property {string} [rawHref]
 * @property {string} title
 * @property {string} referrer
 * @property {number} pageload
 * @property {boolean} isMobile
 */

/** @type {(subsequent: boolean) => EventType} */
function pageview (subsequent) {
  var canonicalLink = document.head.querySelector('link[rel="canonical"]')
  var canonicalHref = canonicalLink && canonicalLink.getAttribute('href')
  /** @type {EventType} */
  var event = {
    type: 'PAGEVIEW',
    href: canonicalHref || window.location.href,
    title: document.title,
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
