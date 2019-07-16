var assert = require('assert')

var crypto = require('./crypto')

describe('src/crypto.js', function () {
  describe('symmetric encryption', function () {
    it('creates, exports and imports keys', function () {
      return crypto
        .createSymmetricKey()
        .then(function (cryptoKey) {
          return crypto.exportKey(cryptoKey)
        })
        .then(function (jwtKey) {
          return crypto.importSymmetricKey(jwtKey)
        })
    })

    it('encrypts and decrypts string values', function () {
      var cryptoKey
      return crypto
        .createSymmetricKey()
        .then(function (_cryptoKey) {
          cryptoKey = _cryptoKey
          return crypto.encryptSymmetricWith(cryptoKey)('alice and bob')
        })
        .then(function (cipher) {
          return crypto.decryptSymmetricWith(cryptoKey)(cipher)
        })
        .then(function (result) {
          assert.strictEqual(result, 'alice and bob')
        })
    })
  })

  describe('assymmetric encryption', function () {
    var publicJWK = {
      'e': 'AQAB',
      'kty': 'RSA',
      'n': 'mz7c1Obxs2gzkqXsPEt1NiijdCPmrcIy_sbJUzKrqh_OcXnBTiipr8stRrBIR52niUSpi9H2kzHu7g1tVbRZEOBj9eYZ2YoEvotrIPcp1D0h6IwVb9LOw59FUvCAMHe_fhC0ERgnlm73bgEURFVzuowSAtmEQe56xLZ4YA4-LyHg0UryVWovpv356E3gxZXz4E7FM8QeyWb_9SylcMwQgHm9Jmdw7L-tuVSe6I40TzlUDd-vVKk_O_WAMIaocrXkAQfv3gzhoZFqR6Lj4w7P8EJNzuXFI_onqW8B1skhaLQJXjDdZwyudrTCbL3zk7AGZq2W9qdi9YiKAzWOz8XThZq8LN4rXwYBRok8Aws0VywrhDfF3CABmlZPnSfTfejPnHWnO_mnDGFtt-x0sJoju0yLROUw2M9TnOWjqwG5QrBevZqS5U_uJtmQ5gvDa_X7gEACcK86Gt3BYBQCfseK2vtO7Lr1ihgiyoe__f_ldEVkuYAcCUEf7Mm5pywBudz8S4sTAk1GLEDtU4LcaQNMknFgTVjUSNMHqgYAnc5rX7vLJlkfikRsXXL2I_JeStm7nwYPkvC3wsaxwPXWD6n8dpHgDMXncXGQoN3PRlFCJboUCuKj56x8kiewKE7tHUEjVj-swuygR4SOt-FEys3z-8KrWYezJrmSjyCr1rkh6Y8'
    }

    var privateJWK = {
      'd': 'AmxdyBj-xt0miPB8GojXAIxr2MFCtY2lfCKgO-M7mME8WLsc0FqEI5FZWJQh3LRSTCs9NkiFv9B0uVSOU1soVMIb7Ve1KZck8dB9UJtrFLwLjnS5VPCGd7lBvMSyS49i9tXN6cJlw8xhol7z8QkgcFYFZfP9Q4Y0dmOex2kRgWzW9I1l8P1iVwn5361vh8YKc4LnQyKZlG0-K5aR0ovs6gR8dmAA_EEVtiHjBSBLIr1zWXAXbYvix83SPW-sq3W5ZGa6UM4Eq5_4d7vMMNwnVMnEKymdBS2_dr6b2b1z_w1oZAcBPb2N755stoPUjIaf4vRsudbtDYYfGWO5ofalkZcaGKozLxIK6gwxBMyxeCZV0Vl5NgWQt4xQid7wiYq66NXj721ycvSxrGCgwiS8No4Fj6ko4X7ZEUHcJg3VekkyIa7PAkosJ2gqtgKrlBYD07bg4xxRdG5mO5zCxuy3ivEAL1c0kKNNT2y8IU7EPxxRxBKIBkRq11J6omvyxuK9oUpWdoNxmMf9wn089RjaVv1mGZRPX0OW_WWbxQT4Xw78UtdlOW735nxWe93NapdoIzMmvGbv1E0rijIZk9Ct5I4GGXSTKpScnB7DZYn2-q6Ps2ElM4cqKoHU1_g_ZvWhwvrFFW5MobfEtDwhg6ADcBfqeKLgm3OjD_pvrMVlqVE',
      'dp': 'VGG1iPFx0AjETUHx9N5a_9RUTFz-Yr3hev6VLMlgOENDobtKFW3QAgRWv_7rUrJb-HsE1SdLt1fSpeTLzP0rn4OwBwA8cppoQJIqW_l6glpips8S9qo_McCGEPwZ3ItNePGDHuynq-nFagNFx48_uGNMMaj-CDGcPAWfwnPLvWuTpqOhjp_8UbOidGWxuds-sPsq614o1v4EVIuyvTyb45a6cIBgPOTqC8Dzh-0AlOsco3dF4fl8Hdqtz0ROf58JL1L-CXOyGbAMNupqhGywN7axvHS3EAUQQHRv-TN1XhEV8S-YQvquf9a4wQ-C7gac9OpbW_Nk0oBS_HvoYNrBdQ',
      'dq': 'ezM2NCgHeqe0ClGCH7t7IW7Bl3klp-Fji_IqI7nZJtumamE59vxYdG-pZWOCfEle8URUZ1pgPdLmtx7T2v4PBJftp0N06qOhk4ewsrvrQLP6peXBPqeaFuNRO2Cs7PP5xk23lzMuf3ia_md7CV5IgApJ7jXpO1x1K2uCXt4tHfRG-VE-IZdGobLQ0QbWw-ruqXHcxPV1mPNbXoqhypYv5lEd8BX3cDg79UzvFPfrnYP7ibo40pNdSTsdXciI_NKcNgWGi01dVz3RZkRDjG_XuMePt-s0pBWFAN0bZ_0DIXu9M9Ekm16n-xhvg-a5eqD8dwluSJTDkTSsgsUO-RjXIQ',
      'e': 'AQAB',
      'kty': 'RSA',
      'n': 'mz7c1Obxs2gzkqXsPEt1NiijdCPmrcIy_sbJUzKrqh_OcXnBTiipr8stRrBIR52niUSpi9H2kzHu7g1tVbRZEOBj9eYZ2YoEvotrIPcp1D0h6IwVb9LOw59FUvCAMHe_fhC0ERgnlm73bgEURFVzuowSAtmEQe56xLZ4YA4-LyHg0UryVWovpv356E3gxZXz4E7FM8QeyWb_9SylcMwQgHm9Jmdw7L-tuVSe6I40TzlUDd-vVKk_O_WAMIaocrXkAQfv3gzhoZFqR6Lj4w7P8EJNzuXFI_onqW8B1skhaLQJXjDdZwyudrTCbL3zk7AGZq2W9qdi9YiKAzWOz8XThZq8LN4rXwYBRok8Aws0VywrhDfF3CABmlZPnSfTfejPnHWnO_mnDGFtt-x0sJoju0yLROUw2M9TnOWjqwG5QrBevZqS5U_uJtmQ5gvDa_X7gEACcK86Gt3BYBQCfseK2vtO7Lr1ihgiyoe__f_ldEVkuYAcCUEf7Mm5pywBudz8S4sTAk1GLEDtU4LcaQNMknFgTVjUSNMHqgYAnc5rX7vLJlkfikRsXXL2I_JeStm7nwYPkvC3wsaxwPXWD6n8dpHgDMXncXGQoN3PRlFCJboUCuKj56x8kiewKE7tHUEjVj-swuygR4SOt-FEys3z-8KrWYezJrmSjyCr1rkh6Y8',
      'p': 'wy0aNSc4Fcefxs9m-Jy0COJrmJP7u6k6pUUxMwj9bkcNCZ8kavl0GWjne1gMvGorEZv5tpBjciUiVKv4kjuHVWlTq8ugr_44Ah40IjkySal9OA0ZS740jEtQlqcHuMcmw0HLRnQbLsKzLolwlaqYCgCC324ihlSSfdI-j0GYr5BDh7fwHl8vH8j1rqZDwlE2VsorB6dHAhFXWzNLc42EgqKBVtpCE3QzG8PIpBT3ShpcQN7_fLuNEVrDbaaa0xLIPR1ploWkk9VV4MxsMZPNOfoxyy9biDIqTEMnEH4wZ9pzRaNiqxQpXge0B_QJl1C_EdQ8jk8wwJom5PBgiaaS1w',
      'q': 'y6Al2tpLKslE4zCNoWohz3Y4FGtPDlOXPOfXcQ9y5gaKt6mrmzihQRrRXg8vIPOMKuPcpNtaJ70XfNiwMAvXNtGowk_ge0pgX00dK_UkAOy7CM8OhB_fWQ10lwj2jwXant7AAysjXwDRBL3siJ79H2Udx3FkffU1bjLBzb-rrutl3OE9P6QeA7pklgoExQBnbiVHgDvgyySfF53eToHCXBjsJgoEU6t6G-V7A-ShLlpKNJCIBhHr4uyLgrydkKrPomwu5yf0ddUimwlIZB5LGifgYyJMfPQnS3KPXB6LfsQapfBNJEDKN_Bd-mkW6kwgEwuGvYVpRirNdSACDddACQ',
      'qi': 'wJ_Ckikd-MzcdQ2W9b___jOMiiVr8GD_XfQDRXue0k1K1lBdZ6d8lOXghqPp80yzxAleNuzaVhorQmL1Su6VAiwxEpGXpWsfuLUYTmUwecT9aensWNTQR6erTg27xeQscR7qwrBmn5uourhbdCHWvIKadS-kw3HaVDS8KV9etLQsj0rS8QwKeh__x6rJ9drXOZwW15rioCBx1mOVVYeHr_8hqP3lNlBdhQVBv-jaJ593N6--Ijx0XWVwpCA0QWW9YJ_6x3nzIheVW0z8LolPBDx7Vxt3bJ_8otUkRVpc9IyvWPn8YLU1-EbnLsbF6mmS3hL_PKTBBmYt3uG3LihC0A'
    }

    it('imports public keys', function () {
      return crypto
        .importPublicKey(publicJWK)
        .then(function (key) {
          assert(key)
        })
    })

    it('imports private keys', function () {
      return crypto
        .importPrivateKey(privateJWK)
        .then(function (key) {
          assert(key)
        })
    })

    it('encrypts and decrypts string values', function () {
      return Promise
        .all([
          crypto.importPublicKey(publicJWK),
          crypto.importPrivateKey(privateJWK)
        ])
        .then(function (keys) {
          var publicKey = keys[0]
          var privateKey = keys[1]
          return crypto.encryptAsymmetricWith(publicKey)('alice and bob')
            .then(function (cipher) {
              return crypto.decryptAsymmetricWith(privateKey)(cipher)
            })
            .then(function (result) {
              assert.strictEqual(result, 'alice and bob')
            })
        })
    })
  })
})
