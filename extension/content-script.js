/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/* global chrome */

(function main () {
  const s = document.createElement('script')
  s.src = chrome.runtime.getURL('page-script.js')
  s.onload = function () {
    this.remove()
  }
  ;(document.head || document.documentElement).appendChild(s)

  document.addEventListener('Offen_connectExtension', handleConnectExtension)
  document.addEventListener('Offen_queryExtension', handleQueryExtension)
})()

function handleQueryExtension () {
  chrome.runtime.sendMessage({
    type: 'QUERY'
  }, (result) => {
    if (result.error) {
      console.error(
        `Failed to query list of known installs: ${result.error.message}.`
      )
      return
    }
    window.postMessage({
      direction: 'from-content-script',
      message: result.payload
    }, '*')
  })
}

function handleConnectExtension (evt) {
  const url = new window.URL(evt.detail.url)
  return checkScriptIntegrity(url)
    .then((version) => {
      if (!version) {
        console.log(`Could not verify installation at "${evt.detail.url}", skipping`)
        return
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'ADD', payload: url.origin }, (response) => {
          if (response.error) {
            reject(response.error)
            return
          }
          resolve(response.payload)
        })
      })
        .then(() => {
          console.log(`"${evt.detail.url}"" was added to the list of known installs.`)
        })
    })
    .catch(err => {
      console.error(
        `Failed to add "${evt.detail.hostname}" to list of known installs: ${err.message}.`
      )
    })
}

function checkScriptIntegrity (urlObj) {
  function fetchKnownChecksums () {
    return window.fetch(chrome.runtime.getURL('checksums.txt'))
      .then(r => r.text())
      .then(file => file.split('\n').map(line => line.trim()).filter(Boolean))
  }

  function fetchCurrentChecksum () {
    const url = new window.URL(urlObj)
    url.pathname = '/script.js'
    return window.fetch(url)
      .then((res) => {
        return res.text()
      })
      .then((script) => {
        return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(script))
      })
      .then((hash) => {
        return [...new Uint8Array(hash)]
          .map(x => x.toString(16).padStart(2, '0')).join('')
      })
  }

  function fetchCurrentVersion () {
    const url = new window.URL(urlObj)
    url.pathname = '/versionz'
    return window.fetch(url)
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        return res.revision
      })
  }

  return Promise.all([fetchCurrentChecksum(), fetchKnownChecksums()])
    .then(([checksum, checksums]) => {
      return checksums.indexOf(checksum) >= 0
    })
    .then((ok) => {
      if (!ok) {
        return null
      }
      return fetchCurrentVersion()
    })
}
