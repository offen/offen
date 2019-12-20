var assert = require('assert')

var getSessionId = require('./session-id')

describe('src/session-id.js', function () {
  describe('getSessionId(accountId)', function () {
    it('returns unstable values in the context of the test setup', function () {
      var resultA = getSessionId('account-a')
      var resultB = getSessionId('account-a')
      var resultC = getSessionId('account-b')
      assert.notStrictEqual(resultA, resultB)
      assert.notStrictEqual(resultB, resultC)
    })
  })
})
