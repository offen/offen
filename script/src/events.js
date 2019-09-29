exports.pageview = pageview

function pageview () {
  return {
    type: 'PAGEVIEW',
    href: window.location.href,
    title: document.title,
    referrer: document.referrer
  }
}
