var vault = require('offen/vault')

var checkSupport = require('./src/check-support')
var accountId = document.currentScript.dataset.accountId

function main () {
  vault(process.env.VAULT_HOST)
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
      postMessage(pageviewEvent)
    })
}

checkSupport(function (err) {
  if (err) {
    console.log('offen does not support this browser or "Do Not Track" is enabled. No data will be collected. Find out more at https://www.offen.dev')
    return
  }
  main()
})
