var assert = require('assert')

var ensureUserSecret = require('./user-secret')

var response = {
  'account_id': '9b63c4d8-65c0-438c-9d30-cc4b01173393',
  'public_key': {
    'kty': 'RSA',
    'n': 'sWDRHwcAfKv1dykP9-Qu-JeRjbmqiVpgzTHgDGMxqkj0ftGhAURBqxAV0CbYXyNGb8g23Jta5JkskwAZ6iugU4bo19T-hqjrGNTm-hynKhtniuvkoxxyzmxnKMlq27k_gdMR_z2Zdoj3mUveRDaAXyaoPmS0ode-s9jSb030KzPhnjcQpa338Qx9Q5BF7MWuQ6013atmU3dM7ibuJ4kwrh_a2b4dj95onh1tPklGYgS1i1fgGWXP16oW1YlAmUtUUFtdnVnNPfSAyMNy1myV2H7q8ZPcZKOz_IyHgAHuB0D6WuIJ-03OzlinxX9RTAS-4dX_vXh7hP24v9-hxIlVIdd9iCQM65shwmXa2NfHYDEaPFo7M-lz_-jHCqCoZIYP3q88hGW9QeVGxAFL3AIJcUb5JRFhw2XqYUUZhLNBBWHUJEmseYP3k4NZr3gG90WTCfxhOmCTzPnCrr9QBINY-ijcyJgPvGEUK8ucq3NdASBQpkHyVcjmr6tmKBDal6jma5xXVX7IexuRINYImGZIuWKF8KTqvaIECR-yP9GdWjAPChHa29j0lZbkUuZbwgeJO5O2GVlImYazz3pR-xRJMOU8N2wipTcCnXJT4oOEYxe3NAv2ulqQESEvS42tb-l0QPDzah4jns86zMAwLNx7hIXas8C77vu9SaQjEzv1tdE',
    'e': 'AQAB'
  }
}

describe('src/user-secret.js', function () {
  describe('ensureUserSecret(accountId)', function () {
    it('handles the key exchange', function () {
      var mockApi = {
        getPublicKey: function () {
          return Promise.resolve(response)
        },
        postUserSecret: function () {
          return Promise.resolve()
        }
      }
      var ensure = ensureUserSecret.ensureUserSecretWith(mockApi)
      var initialKey
      return ensure('7435d1b9-c0ca-4883-a869-42e943589917')
        .then(function (_initialKey) {
          initialKey = _initialKey
          return ensure('7435d1b9-c0ca-4883-a869-42e943589917')
        })
        .then(function (nextKey) {
          assert.deepStrictEqual(initialKey, nextKey)
        })
    })

    it('rejects when public key is unavailable', function (done) {
      var mockApi = {
        getPublicKey: function () {
          return Promise.reject(new Error('Does not work.'))
        },
        postUserSecret: function () {
          return Promise.resolve()
        }
      }
      var ensure = ensureUserSecret.ensureUserSecretWith(mockApi)
      ensure('8435d1b9-c0ca-4883-a869-42e943589917')
        .then(function () {
          done(new Error('Unexpected promise resolution'))
        })
        .catch(function (err) {
          assert.strictEqual(err.message, 'Does not work.')
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })

    it('rejects when user secret cannot be posted', function (done) {
      var mockApi = {
        getPublicKey: function () {
          return Promise.resolve(response)
        },
        postUserSecret: function () {
          return Promise.reject(new Error('Does not work.'))
        }
      }
      var ensure = ensureUserSecret.ensureUserSecretWith(mockApi)
      ensure('9435d1b9-c0ca-4883-a869-42e943589917')
        .then(function () {
          done(new Error('Unexpected promise resolution'))
        })
        .catch(function (err) {
          assert.strictEqual(err.message, 'Does not work.')
          done()
        })
        .catch(function (err) {
          done(err)
        })
    })
  })
})
