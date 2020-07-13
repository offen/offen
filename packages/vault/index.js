/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = createVault

window.__offen__cache__ = window.__offen__cache__ || {}

// createVault inserts an iframe element that will be loading the given source
// and asynchronously resolves with a function that will use the postMessage API
// to send the given message to the iframe element. In case createVault is
// called with the same host value multiple times, the returned function will
// target a single iframe instance.
function createVault (host) {
  if (window.__offen__cache__[host]) {
    return window.__offen__cache__[host]
  }

  var vault = document.createElement('iframe')
  vault.src = host

  vault.style.display = 'none'
  vault.setAttribute('frameBorder', '0')
  vault.setAttribute('scrolling', 'no')

  var elementId = createElementId()
  vault.setAttribute('id', elementId)

  window.__offen__cache__[host] = new Promise(function (resolve, reject) {
    vault.addEventListener('load', function (e) {
      function postMessage (message) {
        return new Promise(function (resolve, reject) {
          var origin = new window.URL(vault.src).origin
          var stylesheet = document.createElement('style')
          stylesheet.setAttribute('id', 'offen-vault-styles')
          message.host = message.host || '#' + elementId

          var messageChannel = new window.MessageChannel()
          messageChannel.port1.onmessage = function (event) {
            var responseMessage = event.data || {}
            switch (responseMessage.type) {
              case 'STYLES':
                if (!document.head.contains(stylesheet)) {
                  document.head.appendChild(stylesheet)
                }
                var payload = responseMessage.payload
                if (payload.styles) {
                  stylesheet.innerHTML = payload.styles
                }
                Object.keys(payload.attributes || {}).forEach(function (attribute) {
                  vault.setAttribute(attribute, payload.attributes[attribute])
                })
                break
              case 'ERROR':
                var err = new Error(responseMessage.payload.error)
                err.originalStack = responseMessage.payload.stack
                err.status = responseMessage.payload.status
                reject(err)
                break
              default:
                resolve(responseMessage)
            }
          }
          messageChannel.port1.onmessageerror = function (err) {
            reject(err)
          }
          vault.contentWindow.postMessage(message, origin, [messageChannel.port2])
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
  return window.__offen__cache__[host]
}

function createElementId () {
  return 'offen-vault-' + Math.random().toString(36).slice(2)
}
