exports.pageview = pageview

function pageview (initial) {
  return {
    type: 'PAGEVIEW',
    href: window.location.href,
    title: document.title,
    referrer: document.referrer,
    pageload: (function () {
      if (initial && window.performance && window.performance.timing) {
        return Math.round(
          window.performance.timing.domInteractive - (window.performance.timeOrigin || window.performance.timing.navigationStart)
        )
      }
      return null
    })()
  }
}
