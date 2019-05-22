const vault = require('./packages/vault')

const accountId = document.currentScript.dataset.accountId

vault(process.env.VAULT_HOST)
  .then(function (iframeEl) {
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
    iframeEl.contentWindow.postMessage(
      JSON.stringify(pageviewEvent),
      process.env.VAULT_HOST
    )
  })
