const assert = require('assert')

const string = require('./string')

describe('string', function () {
  it('exports a string', function () {
    assert(typeof string === 'string')
  })
})
