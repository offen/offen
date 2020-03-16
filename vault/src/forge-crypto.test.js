/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var enqueueCryptoTests = require('./web-crypto.test')
var forgeCrypto = require('./forge-crypto')

enqueueCryptoTests(forgeCrypto, 'src/forge-crypto.js')
