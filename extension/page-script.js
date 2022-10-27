/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

setTimeout(function () {
  if (!window.__offen__) {
    return
  }
  retry(function () {
    return document.querySelector('[id^=offen-vault]')
  }, 20, 10)
    .then(function (vaultElem) {
      const u = new window.URL(vaultElem.src)
      document.dispatchEvent(new window.CustomEvent('Offen_connectExtension', {
        detail: { url: u.toString() }
      }))
    })

  if (window.auditoriumDispatchIntoStore) {
    window.addEventListener('message', function (msg) {
      if (msg.source !== window || msg.data.direction !== 'from-content-script') {
        return
      }
      window.auditoriumDispatchIntoStore({
        type: 'SET_EXTENSION_DATA',
        payload: {
          installs: msg.data.message
        }
      })
    })
    document.dispatchEvent(new window.CustomEvent('Offen_queryExtension', {
      detail: {
        url: window.location.href
      }
    }))
  }
}, 0)

async function retry (thunk, interval, maxRetries) {
  let attempts = 0
  while (attempts < maxRetries) {
    attempts++
    const result = await thunk()
    if (result) {
      return result
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error('Exceeded allowed number of retries while polling.')
}
