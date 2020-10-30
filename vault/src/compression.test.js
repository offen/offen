/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var compression = require('./compression')

var fixture = `
In dolorum autem quod repellendus unde. Aspernatur tenetur sed quibusdam quae tempore qui architecto. Vel nesciunt maxime asperiores quas consequuntur culpa quis. Quae doloribus et doloremque placeat sequi. Sint adipisci itaque perspiciatis facere.

Unde laboriosam ea sed accusamus consequatur quibusdam. Deleniti consequatur nulla necessitatibus. Vitae deleniti ratione at voluptatem. Amet repellat porro et veritatis qui dolore. A nesciunt repellendus praesentium explicabo molestiae occaecati. Atque sed ut consectetur eos.

Nihil et error rem ut officia sint. Eius magni in quae consequatur. Suscipit accusamus minima natus assumenda quod sed corporis.

Odio minus libero provident saepe voluptatem. Error voluptas non tenetur mollitia. Officiis officiis accusamus dolorum.

Adipisci sed deleniti magnam. Fugiat molestias sequi quo doloribus laborum. Quia temporibus exercitationem ut aut quas itaque in ea.
`

describe('src/compression.js', function () {
  it('compresses and decompresses values losslessly', function () {
    return compression.compress(fixture)
      .then(function (compressed) {
        var original = new TextEncoder().encode(fixture)
        assert(new Uint8Array(compressed).length < original.length)
        return compression.decompress(compressed)
      })
      .then(function (v) {
        assert.strictEqual(v, fixture)
      })
  })
})
