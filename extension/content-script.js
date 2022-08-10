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

  const db = new Database()

  document.addEventListener(
    'Offen_connectExtension', handleConnectExtensionWith(db)
  )
  document.addEventListener(
    'Offen_checkScriptIntegrity', handleCheckScriptIntegrityWith()
  )
  document.addEventListener(
    'Offen_queryExtension', handleQueryExtensionWith(db)
  )
})()

function handleQueryExtensionWith (db) {
  return function handleQueryExtension (evt) {
    db.query()
      .then(result => {
        window.postMessage({
          direction: 'from-content-script',
          message: result
        }, '*')
      })
      .catch(err => {
        console.error(
          `Failed to query list of known installs: ${err.message}.`
        )
      })
  }
}

function handleConnectExtensionWith (db) {
  return function handleConnectExtension (evt) {
    db.add(evt.detail.hostname)
      .catch(err => {
        console.error(
          `Failed to add "${evt.detail.hostname}" to list of known installs: ${err.message}.`
        )
      })
  }
}

function handleCheckScriptIntegrityWith () {
  return function handleCheckScriptIntegrity (evt) {
    function fetchScriptChecksum () {
      const script = `${evt.detail.protocol}//${evt.detail.hostname}/script.js`
      return window.fetch(script)
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
    function fetchVersionInfo () {
      const version = `${evt.detail.protocol}//${evt.detail.hostname}/versionz`
      return window.fetch(version)
        .then((res) => res.json())
        .then((i) => i.revision)
    }
    Promise.all([fetchScriptChecksum(), fetchVersionInfo()])
      .then(([checksum, version]) => {
        console.log({ checksum, version })
      })
  }
}

function Database () {
  const storage = new KeyValueStorage(1, {
    vaults: []
  })

  this.add = (domain) => {
    return storage.get('vaults')
      .then((result) => {
        let withAddition = [...result, domain]
        withAddition = withAddition.filter((domain, index, list) => {
          return list.indexOf(domain) === index
        })
        return storage.set('vaults', withAddition)
      })
  }

  this.query = () => {
    return storage.get('vaults')
  }
}

function KeyValueStorage (schemaVersion = 1, seed = {}) {
  const isReady = new Promise((resolve, reject) => {
    chrome.storage.local.get(['__schemaVersion'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }

      if (result && result.__schemaVersion && Number.isFinite(result.__schemaVersion)) {
        resolve()
        return
      }

      const withSchemaVersion = Object.assign(
        {}, { __schemaVersion: schemaVersion }, seed
      )
      Promise.all(Object.entries(withSchemaVersion).map(([key, value]) => {
        return new Promise((resolveOne, rejectOne) => { // eslint-disable-line promise/param-names
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
              rejectOne(chrome.runtime.lastError)
              return
            }
            resolveOne()
          })
        })
      }))
        .then(resolve, reject)
    })
  })

  this.set = (key, value) => {
    return isReady.then(() => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
            return
          }
          resolve()
        })
      })
    })
  }

  this.get = (key) => {
    return isReady.then(() => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
            return
          }
          resolve(result[key])
        })
      })
    })
  }
}
