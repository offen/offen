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
      function postMessage (message, waitForResponse) {
        return new Promise(function (resolve, reject) {
          if (!waitForResponse) {
            try {
              vault.contentWindow.postMessage(message, host)
              resolve(null)
            } catch (err) {
              reject(err)
            }
            return
          }

          var channel = new window.MessageChannel()
          channel.port1.onmessage = function (event) {
            var responseMessage = event.data
            if (responseMessage.type === 'ERROR') {
              var err = new Error(responseMessage.payload.error)
              err.originalStack = responseMessage.payload.stack
              err.status = responseMessage.payload.status
              reject(err)
            }
            resolve(responseMessage)
          }
          channel.port1.onmessageerror = function (err) {
            reject(err)
          }
          vault.contentWindow.postMessage(message, host, [channel.port2])
        })
      }
      resolve(postMessage)
    })
    vault.addEventListener('error', function (err) {
      reject(err)
    })
  })

  if (document.body) {
    document.body.appendChild(vault)
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(vault)
    })
  }
  return createVault[host]
}
