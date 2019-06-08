var assert = require('assert')
var fetchMock = require('fetch-mock')

var getAccount = require('./get-account')

describe('src/get-account.js', function () {
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
      var get = getAccount.getAccountWith('https://server.offen.dev/accounts')
      return get('foo-bar')
        .then(function (result) {
          assert.deepStrictEqual(result, { account_id: 'foo-bar', data: 'ok' })
        })
    })
  })
})
