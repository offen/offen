/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var onIdle = require('on-idle')
var vault = require('offen/vault')

module.exports = router

function router (vaultUrl) {
  function send (message, expectResponse) {
    return vault(vaultUrl)
      .then(function (postMessage) {
        return new Promise(function (resolve) {
          onIdle(function () {
            resolve(postMessage(message, expectResponse))
          })
        })
      })
  }

  var registeredEvents = {}

  var channel = new window.MessageChannel()
  channel.port2.onmessage = function (event) {
    // clone the message so it can be mutated while
    // being passed through the middleware stack
    var context = JSON.parse(JSON.stringify(event.data.context))

    var stack = (registeredEvents[event.data.type] || []).slice()
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

      var nextHandler = stack.shift() || function fallthrough (message, send, next) {
        next(new Error('Event of type "' + event.data.type + '" not handled.'))
      }
      try {
        nextHandler(context, send, next)
      } catch (err) {
        next(err)
      }
    }

    callNext()
  }

  return {
    on: function (eventType/* , ...stack */) {
      var stack = [].slice.call(arguments, 1)
      registeredEvents[eventType] = stack
    },
    dispatch: function (eventType, context) {
      context = context || {}
      channel.port1.postMessage({
        type: eventType,
        context: context
      })
    }
  }
}
