module.exports = createVault

function createVault (host) {
  if (createVault[host]) {
    return createVault[host]
  }

  const vault = document.createElement('iframe')
  vault.src = host

  vault.style.display = 'none'
  vault.setAttribute('width', '0')
  vault.setAttribute('height', '0')
  vault.setAttribute('frameBorder', '0')
  vault.setAttribute('scrolling', 'no')

  createVault[host] = new Promise(function (resolve, reject) {
    vault.addEventListener('load', function (e) {
      resolve(e.target)
    })
    vault.addEventListener('error', function (err) {
      reject(err)
    })
  })

  document.body.appendChild(vault)
  return createVault[host]
}
