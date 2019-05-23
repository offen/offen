const vault = require('offen/vault')

function main () {
  // TODO: ideally, the CDN serving this script would already drop the request
  // requesting this script, but it's probably good to keep this in here anyways
  if (navigator.doNotTrack) {
    return
  }
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
}

main()
