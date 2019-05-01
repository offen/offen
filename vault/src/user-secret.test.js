const assert = require('assert')
const fetchMock = require('fetch-mock')

const ensureUserSecret = require('./user-secret')

const response = {
  'account_id': '9b63c4d8-65c0-438c-9d30-cc4b01173393',
  'public_key': {
    'kty': 'RSA',
    'n': 'sWDRHwcAfKv1dykP9-Qu-JeRjbmqiVpgzTHgDGMxqkj0ftGhAURBqxAV0CbYXyNGb8g23Jta5JkskwAZ6iugU4bo19T-hqjrGNTm-hynKhtniuvkoxxyzmxnKMlq27k_gdMR_z2Zdoj3mUveRDaAXyaoPmS0ode-s9jSb030KzPhnjcQpa338Qx9Q5BF7MWuQ6013atmU3dM7ibuJ4kwrh_a2b4dj95onh1tPklGYgS1i1fgGWXP16oW1YlAmUtUUFtdnVnNPfSAyMNy1myV2H7q8ZPcZKOz_IyHgAHuB0D6WuIJ-03OzlinxX9RTAS-4dX_vXh7hP24v9-hxIlVIdd9iCQM65shwmXa2NfHYDEaPFo7M-lz_-jHCqCoZIYP3q88hGW9QeVGxAFL3AIJcUb5JRFhw2XqYUUZhLNBBWHUJEmseYP3k4NZr3gG90WTCfxhOmCTzPnCrr9QBINY-ijcyJgPvGEUK8ucq3NdASBQpkHyVcjmr6tmKBDal6jma5xXVX7IexuRINYImGZIuWKF8KTqvaIECR-yP9GdWjAPChHa29j0lZbkUuZbwgeJO5O2GVlImYazz3pR-xRJMOU8N2wipTcCnXJT4oOEYxe3NAv2ulqQESEvS42tb-l0QPDzah4jns86zMAwLNx7hIXas8C77vu9SaQjEzv1tdE',
    'e': 'AQAB'
  }
}

describe('src/user-secret.js', function () {
  describe('ensureUserSecret(accountId: string, host: string)', function () {
    context('with server responding', function () {
      beforeEach(function () {
        fetchMock.get('https://server.offen.org/exchange?account_id=7435d1b9-c0ca-4883-a869-42e943589917', response)
        fetchMock.post('https://server.offen.org/exchange', 201)
      })

      afterEach(function () {
        fetchMock.restore()
      })

      it('handles the key exchange', function () {
        let initialKey
        return ensureUserSecret('7435d1b9-c0ca-4883-a869-42e943589917', 'https://server.offen.org')
          .then(function (_initialKey) {
            initialKey = _initialKey
            return ensureUserSecret('7435d1b9-c0ca-4883-a869-42e943589917', 'https://server.offen.org')
          })
          .then(function (nextKey) {
            assert.deepStrictEqual(initialKey, nextKey)
          })
      })
    })

    context('with server failing', function () {
      beforeEach(function () {
        fetchMock.get('https://server.offen.org/exchange?account_id=8435d1b9-c0ca-4883-a869-42e943589917', 500)
        fetchMock.post('https://server.offen.org/exchange', 500)
      })

      afterEach(function () {
        fetchMock.restore()
      })

      it('rejects', function () {
        return ensureUserSecret('8435d1b9-c0ca-4883-a869-42e943589917', 'https://server.offen.org')
          .catch(function (err) {
            assert(err)
            return 'SKIP'
          })
          .then(function (result) {
            if (result !== 'SKIP') {
              throw new Error('Unexpected promise resolution')
            }
          })
      })
    })
  })
})
