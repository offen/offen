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
    vault.addEventListener('load', function (e) {
      function postMessage (message, waitForResponse) {
        return new Promise(function (resolve, reject) {
          var origin = new window.URL(vault.src).origin
          var messageChannel = new window.MessageChannel()
          messageChannel.port1.onmessage = function (event) {
            var responseMessage = event.data
            if (responseMessage.type === 'ERROR') {
              var err = new Error(responseMessage.payload.error)
              err.originalStack = responseMessage.payload.stack
              err.status = responseMessage.payload.status
              reject(err)
            }
            resolve(responseMessage)
          }
          messageChannel.port1.onmessageerror = function (err) {
            reject(err)
          }

          var receiveStyles = new window.MessageChannel()
          receiveStyles.port1.onmessage = function (event) {
            Object.assign(vault.style, event.data.styles)
            Object.keys(event.data.attributes || {}).forEach(function (attribute) {
              vault.setAttribute(attribute, event.data.attributes[attribute])
            })
          }

          vault.contentWindow.postMessage(message, origin, [messageChannel.port2, receiveStyles.port2])
        })
      }
      resolve(postMessage)
    })
    vault.addEventListener('error', function (err) {
      reject(err)
    })
  })

  switch (document.readyState) {
    case 'complete':
    case 'loaded':
    case 'interactive':
      document.body.appendChild(vault)
      break
    default:
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(vault)
      })
  }
  return createVault[host]
}
