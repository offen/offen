/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var queries = require('./queries')

describe('src/queries.js', function () {
  describe('getDefaultStats(accountId, query, privateJwk)', function () {
    it('throws on bad arguments', function () {
      var q = new queries.Queries()
      var err
      return q.getDefaultStats('abc-123', {})
        .catch(function (_err) {
          err = _err
        })
        .then(function () {
          assert(err)
        })
    })

    it('throws on unknown query parameters', function () {
      var q = new queries.Queries()
      var err
      return q.getDefaultStats('abc-123', { range: 12, resolution: 'aeons' }, {})
        .catch(function (_err) {
          err = _err
        })
        .then(function () {
          assert(err)
        })
    })
  })
})
