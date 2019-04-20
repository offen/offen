const request = require('supertest')

const app = require('./app')

describe('app.', function () {
  describe('GET /', function () {
    it('responds ok', function (done) {
      request(app)
        .get('/')
        .expect(200, done)
    })
  })
})
