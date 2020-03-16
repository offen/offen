/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var fetchMock = require('fetch-mock')

var handleFetchResponse = require('.')

describe('fetch-response/index.js', function () {
  describe('handleFetchResponse(response)', function () {
    context('with successful response', function () {
      before(function () {
        fetchMock.get('https://example.net', {
          body: '{"ok":"yes"}',
          status: 200
        })
      })

      after(function () {
        fetchMock.restore()
      })

      it('parses the response and passes it on', function () {
        return window
          .fetch('https://example.net')
          .then(handleFetchResponse)
          .then(function (data) {
            assert.strictEqual(data.ok, 'yes')
          })
      })
    })

    context('with successful empty response', function () {
      before(function () {
        fetchMock.get('https://example.net', {
          status: 204
        })
      })

      after(function () {
        fetchMock.restore()
      })

      it('parses the response and passes it on', function () {
        return window
          .fetch('https://example.net')
          .then(handleFetchResponse)
          .then(function (data) {
            assert.strictEqual(data, null)
          })
      })
    })

    context('with 40x response', function () {
      before(function () {
        fetchMock.get('https://example.net', {
          status: 400,
          body: '{"status":400,"error":"did not work"}'
        })
      })

      after(function () {
        fetchMock.restore()
      })

      it('rejects with an error containing the error message', function (done) {
        window
          .fetch('https://example.net')
          .then(handleFetchResponse)
          .then(function () {
            done(new Error('Unexpected Promise resolution'))
          })
          .catch(function (err) {
            assert.strictEqual(err.message, 'did not work')
            assert.strictEqual(err.status, 400)
            done()
          })
          .catch(function (err) {
            done(err)
          })
      })
    })

    context('with 50x response', function () {
      before(function () {
        fetchMock.get('https://example.net', {
          status: 503,
          body: '{"status":500,"error":"could not connect to database"}'
        })
      })

      after(function () {
        fetchMock.restore()
      })

      it('rejects with an error containing the error message', function (done) {
        window
          .fetch('https://example.net')
          .then(handleFetchResponse)
          .then(function () {
            done(new Error('Unexpected Promise resolution'))
          })
          .catch(function (err) {
            assert.strictEqual(err.message, 'could not connect to database')
            assert.strictEqual(err.status, 503)
            done()
          })
          .catch(function (err) {
            done(err)
          })
      })
    })

    context('with malformed response', function () {
      before(function () {
        fetchMock.get('https://example.net', {
          status: 500,
          body: 'Internal Server Error'
        })
      })

      after(function () {
        fetchMock.restore()
      })

      it('rejects with an error containing the error message', function (done) {
        window
          .fetch('https://example.net')
          .then(handleFetchResponse)
          .then(function () {
            done(new Error('Unexpected Promise resolution'))
          })
          .catch(function (err) {
            assert.strictEqual(err.status, 500)
            assert.strictEqual(err.message, 'Internal Server Error')
            done()
          })
          .catch(function (err) {
            done(err)
          })
      })
    })
  })
})
