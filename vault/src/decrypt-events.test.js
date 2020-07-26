/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var Unibabel = require('unibabel').Unibabel

var decryptEventsWith = require('./decrypt-events').decryptEventsWith

describe('src/decrypt-events.js', function () {
  describe('decryptEvents', function () {
    var decryptEvents = decryptEventsWith(null)

    var encryptedEventPayload
    var encryptedUserSecret
    var accountKey
    var privateJwk
    var userSecret
    var userJWK
    var nonce
    before(function () {
      return window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
        .then(function (_userSecret) {
          userSecret = _userSecret
          return window.crypto.subtle.exportKey('jwk', userSecret)
        })
        .then(function (_userJWK) {
          userJWK = _userJWK
          return window.crypto.subtle.generateKey(
            {
              name: 'RSA-OAEP',
              modulusLength: 2048,
              publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
              hash: { name: 'SHA-256' }
            },
            true,
            ['encrypt', 'decrypt']
          )
        })
        .then(function (_accountKey) {
          accountKey = _accountKey
          return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
        })
        .then(function (_privateJwk) {
          privateJwk = _privateJwk
          return window.crypto.subtle.encrypt(
            {
              name: 'RSA-OAEP'
            },
            accountKey.publicKey,
            Unibabel.utf8ToBuffer(JSON.stringify(userJWK))
          )
        })
        .then(function (encrypted) {
          encryptedUserSecret = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted))
        })
        .then(function () {
          nonce = window.crypto.getRandomValues(new Uint8Array(12))
          return window.crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: nonce,
              length: 128
            },
            userSecret,
            Unibabel.utf8ToBuffer(JSON.stringify({ type: 'TEST' }))
          )
        })
        .then(function (encrypted) {
          encryptedEventPayload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(nonce)
        })
    })

    it('returns the given events with decrypted payloads', function () {
      return decryptEvents(
        'account-a',
        [
          {
            secretId: 'user-id',
            payload: encryptedEventPayload
          },
          {
            secretId: 'unknown-user',
            payload: encryptedEventPayload
          },
          {
            secretId: 'user-id',
            payload: 'bogus-value'
          }
        ],
        [
          {
            secretId: 'user-id',
            value: encryptedUserSecret
          }
        ],
        privateJwk
      )
        .then(function (result) {
          assert.deepStrictEqual(
            result,
            [
              {
                secretId: 'user-id',
                payload: { type: 'TEST' }
              }
            ]
          )
        })
    })
  })
})
