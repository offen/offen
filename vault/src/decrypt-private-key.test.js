var assert = require('assert')
var fetchMock = require('fetch-mock')

var decryptPrivateKey = require('./decrypt-private-key')

describe('src/decrypt-private-key', function () {
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
      var decrypt = decryptPrivateKey.decryptPrivateKeyWith('https://kms.offen.dev/decrypt')
      return decrypt('fbo-ora')
        .then(function (decrypted) {
          assert.deepStrictEqual(decrypted, { decrypted: 'foo-bar' })
        })
    })
  })
})
