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

      return requestFromBackgroundScript('ADD', {
        host: new window.URL(window.location.origin).host,
        origin: url.origin,
        version: version
      })
        .then(() => {
          console.log(`"${url.host}" was added to the list of known installs.`)
        })
    })
    .catch(err => {
      console.error(
        `Failed to add "${url.host}" to list of known installs: ${err.message}.`
      )
    })
}

function checkScriptIntegrity (urlObj) {
  function fetchKnownChecksums () {
    return requestFromBackgroundScript('GET_KNOWN_CHECKSUMS', null)
  }

  function fetchCurrentChecksum () {
    return requestFromBackgroundScript('GET_CURRENT_CHECKSUM', urlObj)
  }

  function fetchCurrentVersion () {
    return requestFromBackgroundScript('GET_CURRENT_VERSION', urlObj)
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

function requestFromBackgroundScript (type, payload) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage({
      type: type,
      payload: payload
    }, (response) => {
      if (response.error) {
        reject(response.error)
        return
      }
      resolve(response.payload)
    })
  })
}
