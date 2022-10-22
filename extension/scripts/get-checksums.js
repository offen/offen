#!/usr/bin/env node

/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const crypto = require('crypto')
const fetch = require('node-fetch')
const { parse } = require('node-html-parser')

const root = process.argv[2]

;(async () => {
  const results = {}
  const resources = ['/script.js']

  const res = await fetch(`${root}/auditorium`)
  const html = await res.text()
  const dom = parse(html)
  const scripts = dom.querySelectorAll('script')
  for (const script of scripts) {
    resources.push(script.getAttribute('src'))
  }

  for (const resource of resources) {
    results[resource] = await getChecksum(`${root}${resource}`)
  }

  return JSON.stringify(results, null, 2)
})()
  .then((result) => {
    console.log(result)
  })
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })

async function getChecksum (url) {
  const res = await fetch(url)
  const body = await res.text()
  return crypto.createHash('sha256').update(body).digest('hex')
}
