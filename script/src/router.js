/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const onIdle = require('on-idle')
const vault = require('offen/vault')

module.exports = router

function router (vaultUrl) {
  const registeredEvents = {}
  const callbacks = {}

  function makeSend (callbackId) {
    return function send (message) {
      const result = vault(vaultUrl)
        .then(function (postMessage) {
          return new Promise(function (resolve) {
            onIdle(function () {
              resolve(postMessage(message))
            })
          })
        })

      if (callbackId) {
        const cb = callbacks[callbackId]
        delete callbacks[callbackId]
        result.then(function (val) {
          cb(null, val)
        }, function (err) {
          cb(err)
        })
      }

      return result
    }
  }

  const channel = new window.MessageChannel()
  channel.port2.onmessage = function (event) {
    // clone the message so it can be mutated while
    // being passed through the middleware stack
    const context = JSON.parse(JSON.stringify(event.data.context))

    const stack = (registeredEvents[event.data.type] || []).slice()
    function callNext () {
      function next (err) {
        if (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(err)
          }
          return
        }
        callNext()
      }

      const nextHandler = stack.shift() || function fallthrough (message, send, next) {
        next(new Error('Event of type "' + event.data.type + '" not handled.'))
      }
      try {
        nextHandler(context, makeSend(event.data.callbackId), next)
      } catch (err) {
        next(err)
      }
    }

    callNext()
  }

  return {
    on: function (eventType/* , ...stack */) {
      const stack = [].slice.call(arguments, 1)
      registeredEvents[eventType] = stack
    },
    dispatch: function (eventType, context, callback) {
      context = context || {}
      let callbackId
      if (callback) {
        callbackId = Math.random().toString(36).slice(2)
        callbacks[callbackId] = callback
      }
      channel.port1.postMessage({
        type: eventType,
        context: context,
        callbackId: callbackId
      })
    }
  }
}
