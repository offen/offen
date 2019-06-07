var vault = require('offen/vault')

module.exports = bootstrap

function bootstrap (host, accountId) {
  return vault(host)
    .then(function (postMessage) {
      const pageviewEvent = {
        type: 'EVENT',
        payload: {
          accountId: accountId,
          event: {
            type: 'PAGEVIEW',
            href: window.location.href,
            title: document.title,
            referrer: document.referrer
          }
        }
      }
      return postMessage(pageviewEvent)
    })
}
