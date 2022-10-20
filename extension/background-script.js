/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/* global chrome */
const db = new Database()

const tabs = {}

chrome.runtime.onMessage.addListener(function (message, sender, respond) {
  switch (message.type) {
    case 'ADD':
      chrome.browserAction.setIcon({
        path: 'icons/on.png',
        tabId: sender.tab.id
      })
      tabs[sender.tab.id] = message.payload
      db
        .add(message.payload.origin)
        .then(
          (result) => respond({ payload: result }),
          (err) => respond({ error: err })
        )
      return true
    case 'QUERY':
      db
        .query(message.payload)
        .then(
          (result) => {
            respond({ payload: result })
          },
          (err) => respond({ error: err })
        )
      return true
    case 'STATUS': {
      respond({ payload: tabs[message.payload] || null })
      return false
    }
    case 'VERIFY_AUDITORIUM': {
      setTimeout(() => {
        respond({ payload: true })
      }, 50)
      return true
    }
    case 'GET_CURRENT_CHECKSUM': {
      const url = new window.URL(message.payload)
      url.pathname = '/script.js'
      window.fetch(url)
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
        .then(
          (result) => respond({ payload: result }),
          (err) => respond({ error: err })
        )
      return true
    }
    case 'GET_CURRENT_VERSION': {
      const url = new window.URL(message.payload)
      url.pathname = '/versionz'
      window.fetch(url)
        .then((res) => {
          return res.json()
        })
        .then((res) => {
          return res.revision
        })
        .then(
          (result) => respond({ payload: result }),
          (err) => respond({ error: err })
        )
      return true
    }
    case 'GET_KNOWN_CHECKSUMS': {
      window.fetch(chrome.runtime.getURL('checksums.txt'))
        .then(r => r.text())
        .then(file => {
          return file.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .filter(l => l.indexOf('#') !== 0)
            .filter((el, index, list) => list.indexOf(el) === index)
        })
        .then(
          (result) => respond({ payload: result }),
          (err) => respond({ error: err })
        )
      return true
    }
    default:
      throw new Error(
        `Background script received unknown message type "${message.type}".`
      )
  }
})

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

  this.setCurrentVersion = (current) => {
    return storage.set('current', current)
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
