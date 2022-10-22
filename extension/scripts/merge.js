#!/usr/bin/env node

/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path')
const fs = require('fs')

const target = path.resolve(process.cwd(), process.argv[2])
const version = process.argv[3]

;(async () => {
  const stdin = fs.readFileSync(0, 'utf-8')
  const additions = JSON.parse(stdin.toString())
  const data = require(target)
  data[version] = data[version] || {}

  for (const [path, checksum] of Object.entries(additions)) {
    console.log(`Adding checksum for ${path} at version ${version}.`)
    data[version][path] = data[version][path] || []
    data[version][path].push(checksum)
    data[version][path] = data[version][path].filter((e, i, coll) => coll.indexOf(e) === i)
  }

  await fs.promises.writeFile(target, JSON.stringify(data, null, 2) + '\n')
  return 'Done.'
})()
  .then((result) => {
    console.log(result)
  })
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
