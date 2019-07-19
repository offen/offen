var assert = require('assert')

var mapToBuckets = require('./buckets')

describe('src/buckets.js', function () {
  describe('mapToBuckets(referrerValue)', function () {
    it('groups known referrers', function () {
      var referrers = [
        'www.mysite.com',
        'www.google.de',
        'www.googlelottery.com',
        'www.google.com',
        'm.facebook.com',
        'lm.facebook.com',
        'thefacebook.com',
        'www.kewlorg.com',
        'android-app://org.telegram.messenger',
        'android-app://org.telegrammmm.scam'
      ]
      var mapped = referrers.map(mapToBuckets)
      assert.deepStrictEqual(mapped, [
        'www.mysite.com',
        'Google',
        'www.googlelottery.com',
        'Google',
        'Facebook',
        'Facebook',
        'thefacebook.com',
        'www.kewlorg.com',
        'Telegram',
        'android-app://org.telegrammmm.scam'
      ])
    })
  })
})
