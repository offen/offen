var assert = require('assert')
var fetchMock = require('fetch-mock')

var api = require('./api')

describe('src/api.js', function () {
  describe('decryptPrivateKey', function () {
    before(function () {
      fetchMock.post(function (url, req) {
        if (url !== 'https://kms.offen.dev/decrypt?jwk=1') {
          return false
        }
        try {
          assert.deepStrictEqual(JSON.parse(req.body), { encrypted: 'fbo-ora' })
        } catch (err) {
          return false
        }
        return true
      }, {
        status: 200,
        body: { decrypted: 'foo-bar' }
      })
    })

    after(function () {
      fetchMock.restore()
    })

    it('calls the given endpoint with the correct parameters', function () {
      var decrypt = api.decryptPrivateKeyWith('https://kms.offen.dev/decrypt')
      return decrypt('fbo-ora')
        .then(function (decrypted) {
          assert.deepStrictEqual(decrypted, { decrypted: 'foo-bar' })
        })
    })
  })

  describe('getAccount', function () {
    before(function () {
      fetchMock.get('https://server.offen.dev/accounts?account_id=foo-bar', {
        status: 200,
        body: { account_id: 'foo-bar', data: 'ok' }
      })
    })

    after(function () {
      fetchMock.restore()
    })

    it('calls the given endpoint with the correct parameters', function () {
      var get = api.getAccountWith('https://server.offen.dev/accounts')
      return get('foo-bar')
        .then(function (result) {
          assert.deepStrictEqual(result, { account_id: 'foo-bar', data: 'ok' })
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
      var get = api.getEventsWith('https://server.offen.dev/events')
      return get()
        .then(function (result) {
          assert.deepStrictEqual(result, { events: ['a', 'b', 'c'] })
        })
    })
  })
})
