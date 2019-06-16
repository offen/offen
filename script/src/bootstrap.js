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
      return new Promise(function (resolve) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(function () {
            resolve(postMessage(pageviewEvent))
          })
        } else {
          resolve(postMessage(pageviewEvent))
        }
      })
    })
}
