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

function handleQueryExtension (evt) {
  const url = new window.URL(evt.detail.url)
  checkAuditoriumIntegrity(url)
    .then((ok) => {
      if (!ok) {
        console.log(`Could not verify installation at "${evt.detail.url}", skipping`)
        return null
      }
      return requestFromBackgroundScript('QUERY')
    })
    .then((result) => {
      if (!result) {
        return
      }
      window.postMessage({
        direction: 'from-content-script',
        message: result
      }, '*')
    })
    .catch((err) => {
      console.error(
        `Failed to query list of known installs: ${err.message}.`
      )
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

function checkAuditoriumIntegrity (urlObj) {
  return Promise.all([
    requestFromBackgroundScript('GET_AUDITORIUM_CHECKSUM', urlObj.toString()),
    requestFromBackgroundScript('GET_KNOWN_CHECKSUMS', null)
  ])
    .then(([checksum, checksums]) => {
      const auditoriumChecksums = Object.values(checksums)
        .map(v => v.auditorium || [])
        .reduce((acc, list) => {
          return [...acc, ...list]
        }, [])
        .filter((value, index, list) => {
          return list.indexOf(value) === index
        })
      return auditoriumChecksums.indexOf(checksum) >= 0
    })
    .then((ok) => {
      if (!ok) {
        return null
      }
      return requestFromBackgroundScript('GET_CURRENT_VERSION', urlObj.toString())
    })
}

function checkScriptIntegrity (urlObj) {
  return Promise.all([
    requestFromBackgroundScript('GET_SCRIPT_CHECKSUM', urlObj.toString()),
    requestFromBackgroundScript('GET_KNOWN_CHECKSUMS', null)
  ])
    .then(([checksum, checksums]) => {
      const scriptChecksums = Object.values(checksums)
        .map(v => v.script)
        .reduce((acc, list) => {
          return [...acc, ...list]
        }, [])
        .filter((value, index, list) => {
          return list.indexOf(value) === index
        })
      return scriptChecksums.indexOf(checksum) >= 0
    })
    .then((ok) => {
      if (!ok) {
        return null
      }
      return requestFromBackgroundScript('GET_CURRENT_VERSION', urlObj.toString())
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
