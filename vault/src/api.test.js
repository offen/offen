/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var fetchMock = require('fetch-mock').default

var api = require('./api')

describe('src/api.js', function () {
  describe('getAccount', function () {
    before(function () {
      fetchMock.mockGlobal().route({
        url: 'https://server.offen.dev/accounts/foo-bar',
        method: 'get'
      }, {
        status: 200,
        body: { accountId: 'foo-bar', data: 'ok' }
      })
    })

    after(function () {
      fetchMock.removeRoutes()
      fetchMock.unmockGlobal()
    })

    it('calls the given endpoint with the correct parameters', function () {
      var get = api.getAccountWith('https://server.offen.dev/accounts')
      return get('foo-bar')
        .then(function (result) {
          assert.deepStrictEqual(result, { accountId: 'foo-bar', data: 'ok' })
        })
    })
  })

  describe('getEvents', function () {
    before(function () {
      fetchMock.mockGlobal().route({
        url: 'https://server.offen.dev/events',
        method: 'get'
      }, {
        status: 200,
        body: { events: ['a', 'b', 'c'] }
      })
    })

    after(function () {
      fetchMock.removeRoutes()
      fetchMock.unmockGlobal()
    })

    it('calls the given endpoint with the correct parameters', function () {
      var get = api.getEventsWith('https://server.offen.dev/events')
      return get()
        .then(function (result) {
          assert.deepStrictEqual(result, { events: ['a', 'b', 'c'] })
        })
    })
  })
})
