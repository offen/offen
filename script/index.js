const accountId = document.currentScript.dataset.accountId

const vault = document.createElement('iframe')
vault.src = process.env.VAULT_HOST

vault.style.display = 'none'
vault.setAttribute('width', '0')
vault.setAttribute('height', '0')
vault.setAttribute('frameBorder', '0')
vault.setAttribute('scrolling', 'no')

vault.addEventListener('load', function (e) {
  const pageviewEvent = {
    type: 'EVENT',
    payload: {
      accountId: accountId,
      event: {
        type: 'PAGEVIEW',
        href: window.location.href,
        referrer: document.referrer,
        timestamp: new Date()
      }
    }
  }
  e.target.contentWindow.postMessage(
    JSON.stringify(pageviewEvent),
    process.env.VAULT_HOST
  )
})

document.body.appendChild(vault)
