/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/* global chrome */

const el = document.createElement('h2')
el.innerText = chrome.i18n.getMessage('popup_subline')

document.body.appendChild(el)

function localizeHtmlPage () {
  var objects = document.getElementsByTagName('html')
  for (const obj of objects) {
    obj.innerHTML = obj.innerHTML.replace(/__MSG_(\w+)__/g, function (match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })
  }
}

localizeHtmlPage()
