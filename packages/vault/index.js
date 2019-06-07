module.exports = createVault

// createVault inserts an iframe element that will be loading the given source
// and asynchronously resolves with a function that will use the postMessage API
// to send the given message to the iframe element. In case createVault is
// called with the same host value multiple times, the returned function will
// target a single iframe instance.
function createVault (host) {
  if (createVault[host]) {
    return createVault[host]
  }

  var vault = document.createElement('iframe')
  vault.src = host

  vault.style.display = 'none'
  vault.setAttribute('width', '0')
  vault.setAttribute('height', '0')
  vault.setAttribute('frameBorder', '0')
  vault.setAttribute('scrolling', 'no')

  createVault[host] = new Promise(function (resolve, reject) {
    vault.addEventListener('load', function () {
      function postMessage (message) {
        return new Promise(function (resolve, reject) {
          function digestResponse (event) {
            var responseMessage = event.data
            if (responseMessage.responseTo !== message.respondWith) {
              return
            }
            delete responseMessage.responseTo
            window.removeEventListener('message', digestResponse)
            if (responseMessage.type === 'ERROR') {
              reject(new Error(responseMessage.payload.error))
            }
            resolve(responseMessage)
          }

          vault.contentWindow.postMessage(message, host)

          if (message.respondWith) {
            window.addEventListener('message', digestResponse)
          } else {
            resolve(null)
          }
        })
      }
      resolve(postMessage)
    })
    vault.addEventListener('error', function (err) {
      reject(err)
    })
  })

  document.body.appendChild(vault)
  return createVault[host]
}
