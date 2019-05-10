const accountId = document.currentScript.dataset.accountId

const iframe = document.createElement('iframe')

iframe.src = process.env.VAULT_HOST
iframe.addEventListener('load', function (e) {
  const pageviewEvent = {
    type: 'EVENT',
    payload: {
      accountId: accountId,
      event: {
        type: 'PAGEVIEW',
        href: window.location.href
      }
    }
  }
  e.target.contentWindow.postMessage(
    JSON.stringify(pageviewEvent),
    process.env.VAULT_HOST
  )
})

document.body.appendChild(iframe)
