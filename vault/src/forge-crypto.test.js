/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const enqueueCryptoTests = require('./web-crypto.test')
const forgeCrypto = require('./forge-crypto')

enqueueCryptoTests(forgeCrypto, 'src/forge-crypto.js')
