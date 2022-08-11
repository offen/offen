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
        path: 'xxx.png',
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
