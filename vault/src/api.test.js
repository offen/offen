/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const fetchMock = require('fetch-mock')

const api = require('./api')

describe('src/api.js', function () {
  describe('getAccount', function () {
    before(function () {
      fetchMock.get('https://server.offen.dev/accounts/foo-bar', {
        status: 200,
        body: { accountId: 'foo-bar', data: 'ok' }
      })
    })

    after(function () {
      fetchMock.restore()
    })

    it('calls the given endpoint with the correct parameters', function () {
      const get = api.getAccountWith('https://server.offen.dev/accounts')
      return get('foo-bar')
        .then(function (result) {
          assert.deepStrictEqual(result, { accountId: 'foo-bar', data: 'ok' })
        })
    })
  })

  describe('getEvents', function () {
    before(function () {
      fetchMock.get('https://server.offen.dev/events', {
        status: 200,
        body: { events: ['a', 'b', 'c'] }
      })
    })

    after(function () {
      fetchMock.restore()
    })

    it('calls the given endpoint with the correct parameters', function () {
      const get = api.getEventsWith('https://server.offen.dev/events')
      return get()
        .then(function (result) {
          assert.deepStrictEqual(result, { events: ['a', 'b', 'c'] })
        })
    })
  })
})
