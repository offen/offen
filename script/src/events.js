exports.pageview = pageview

function pageview () {
  return {
    type: 'PAGEVIEW',
    href: window.location.href,
    title: document.title,
    referrer: document.referrer,
    pageload: (function () {
      if (window.performance && window.performance.timing) {
        return Math.round(
          window.performance.timing.domInteractive - (window.performance.timeOrigin || window.performance.timing.navigationStart)
        )
      }
      return null
    })()
  }
}
