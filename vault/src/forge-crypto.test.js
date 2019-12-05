var enqueueCryptoTests = require('./web-crypto.test')
var forgeCrypto = require('./forge-crypto')

enqueueCryptoTests(forgeCrypto, 'src/forge-crypto.js')
