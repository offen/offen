---
layout: default
title: Metrics Explained
parent: Using Offen
nav_order: 1
description: "Just the Docs is a responsive Jekyll theme with built-in search that is easily customizable and hosted on GitHub Pages."
permalink: /using-offen/metrics-explained/
---

# Metrics Explained

## Pageviews

__Pageviews__ is the total number of pages that have been visited in the selected timeframe. In case your website is a Single Page Application that is using client side routing, a `pushState` event will trigger a new page view.

## Unique Visitors

This metric is only displayed to operators.

__Unique Visitors__ is the total number of unique visitors in the selected timeframe. A visitor is identified by a cookie set after opting in to data collection by Offen. In case a visitor deletes their cookies (either manually or in the Auditorium) without revoking consent, they will generate an additional entry on top on their next visit.

## Unique Accounts

This metric is only displayed to users.

__Unique Accounts__ is the total number of accounts visited by a user. These accounts need to be served by the same instance of Offen, so in most cases this value will be 1.

## Plus

This metric is only displayed to operators.

Offen has the concept of an __anonymous visit__ which means that when a user has disabled cookies, either completely or only for third parties, it will only record an __anonymous visit__ that does not contain any data.

This way we can respect the user's wish for privacy while still giving the  operator a __Plus__ value, which represents a percentage of additional users with unknown behavior on top of the values displayed.

This means if an operator sees a __Pageviews__ metric of 2.500 with a __Plus__ of 10%, they can assume that they had roughly 2.750 pageviews in that period.

## Average Page Depth

__Average Page Depth__ is the average session length in the given timeframe. A session is composed of all the pages linked to an account that a user visits during a single browser session.

## Bounce Rate

The __Bounce Rate__ is the percentage of sessions that only contain a single visit. Visit length is not collected by Offen, so the definition of a bounce is fluid here. A website containing of a single page would always have a bounce rate of 100%. This metric will likely be relevant for you if you have a higher number of small pages that are connected in a well defined flow.

## Mobile Users

__Mobile Users__ is the percentage of users (not pageviews) that Offen considers using a mobile device. We want to respect users privacy and therefore do not use the browser's User Agent String for this in any way. Instead, we check if the device thinks it can change its orientation. In case it does we consider the user to be placed in the mobile bucket.

## Average Page Load Time

__Average Page Load Time__ is the average time it took for served pages to become interactive. In case you use a Single Page Application with client side routing only the initial page load will be measured. Subsequent navigation via `pushState` will be excluded as this metric does not apply in this scenario.

## Pages

__Pages__ displays a list of pages that counts the number of pageviews per URL. These URLs are stripped off any querystring or hash parameters.

## Referrers

__Referrers__ is a list of referrer values that directed users to pages using the Offen instance. Referrers will display only their domain and will also exclude referrals that are coming from the same host domain.

## Campaigns

__Campaigns__ is a list of referrer values that directed users to pages using the Offen instance. For this metric, referrers will be grouped by the `utm_campaign` values contained in their querystring parameters.

## Sources

__Sources__ is a list of referrer values that directed users to pages using the Offen instance. For this metric, referrers will be grouped by the `utm_source` values contained in their querystring parameters.

## Landing Pages

__Landing Pages__ lists and counts the entry pages for each session in the selected timeframe. Subsequent pageviews from these sessions are dropped, leaving the list with the URLs only that users first interacted within a session. Note that this is collected on session level, so a unique returning user might create multiple landing pages.

## Exit Pages

__Exit Pages__ lists and counts the exit pages for each session in the selected timeframe. Only sessions with more than one pageview are taken into account, counting the event with the most recent timestamp. Note that this is collected on session level, so a unique returning user might create multiple exit pages.

## Weekly retention

__Weekly retention__ displays a matrix visualizing user retention over the course of the last 4 weeks. For each of the previous weeks, the percentage of this week's users that have visited the account is calculated and displayed.

A week is defined as a sequence of 7 days (as opposed to a week in the calendar) in this scenario, so updates are rolling.

## Right now

This metric is only displayed to operators.

The Right now panel displays metrics that are only looking at the last 15 minutes. The active pages metric will display only pages that users are currently interacting with, so this will fluctuate with users progressing in their session's flow.
