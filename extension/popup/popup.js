/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/* global chrome */

localizeHtmlPage()

chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
  chrome.runtime.sendMessage({ type: 'STATUS', payload: activeTab.id }, ({ payload }) => {
    let data = document.querySelector('.install-data').innerHTML
    for (const [key, value] of Object.entries(payload)) {
      data = data.replace(`{${key}}`, value)
    }
    document.querySelector('.install-data').innerHTML = data
    document.querySelector('.install-link').setAttribute('href', `${payload.origin}/auditorium`)
    document.querySelector('.install-info').classList.toggle('dn')
  })
})

function localizeHtmlPage () {
  var objects = document.querySelectorAll('[data-localize]')
  for (const obj of objects) {
    obj.innerHTML = chrome.i18n.getMessage(obj.dataset.localize)
  }
}
