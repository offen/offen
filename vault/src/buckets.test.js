/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const mapToBuckets = require('./buckets')

describe('src/buckets.js', function () {
  describe('mapToBuckets(referrerValue)', function () {
    it('groups known referrers', function () {
      const referrers = [
        'www.mysite.com',
        'www.google.de',
        'www.googlelottery.com',
        'www.google.com',
        'google.com',
        'm.facebook.com',
        'lm.facebook.com',
        'thefacebook.com',
        'www.kewlorg.com',
        'android-app://org.telegram.messenger',
        'android-app://org.telegrammmm.scam',
        'www.facebook.com',
        'android-app://com.Slack',
        'android-app://com.Slackers',
        'www.duckduckgo.com/something',
        'duckduckgo.com',
        'duckduckgone.com',
        'www.baidu.com',
        'baidu.com/search',
        'baidu.complete.com',
        't.co.uk',
        't.co/123',
        'linkedin.com/business-proposal',
        'www.linkedin.com',
        'linkedin.community/malware-download',
        'android-app://com.linkedin.android',
        'android-app://com.linkedinteresting.scam',
        'news.ycombinator.com',
        'news.ycombinator.com/item?id=1234567',
        'news.ycombinator.community',
        'old.redditors.community',
        'old.reddit.com/r/distract-me',
        'www.reddit.com',
        'www.reddit.tk',
        'android-app://com.laurencedawson.reddit_sync.pro',
        'ecosia.org',
        'www.qwant.com'
      ]
      const mapped = referrers.map(mapToBuckets)
      assert.deepStrictEqual(mapped, [
        'www.mysite.com',
        'Google',
        'www.googlelottery.com',
        'Google',
        'Google',
        'Facebook',
        'Facebook',
        'thefacebook.com',
        'www.kewlorg.com',
        'Telegram',
        'android-app://org.telegrammmm.scam',
        'Facebook',
        'Slack',
        'android-app://com.Slackers',
        'DuckDuckGo',
        'DuckDuckGo',
        'duckduckgone.com',
        'Baidu',
        'Baidu',
        'baidu.complete.com',
        't.co.uk',
        'Twitter',
        'LinkedIn',
        'LinkedIn',
        'linkedin.community/malware-download',
        'LinkedIn',
        'android-app://com.linkedinteresting.scam',
        'Hacker News',
        'Hacker News',
        'news.ycombinator.community',
        'old.redditors.community',
        'Reddit',
        'Reddit',
        'www.reddit.tk',
        'Reddit',
        'Ecosia',
        'Qwant'
      ])
    })
  })
})
