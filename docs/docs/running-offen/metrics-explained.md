---
layout: default
title: Metrics explained
nav_order: 7
description: "Explanations of the key metrics displayed in Offen."
permalink: /running-offen/metrics-explained/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Metrics explained
{: .no_toc }

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Real time

This panel displays metrics that are only looking at the last 15 minutes. Values fluctuate with users progressing in their session’s flow.

---

## Active pages

All pages that users are currently interacting with.

---

## Active users on site

The number of unique users that are currently interacting with pages.

---

## Show data from the last

Here you can set the time frame for all displayed metrics. As all data is generally deleted after 6 months, the selection is limited to this duration.

---

## Page views and users

This panel displays the number of visited pages (bright green) and unique users (dark green). In case your website is a Single Page Application that is using client side routing, a `pushState` event will trigger a new page view.

---

## Key metrics

This panel displays the most significant metrics at a glance.

---

## Unique users

The number of unique users that have visited at least one page. Unique users are identified by a cookie set after opting in to data collection. In case they delete their cookies manually without revoking consent, they will generate an additional entry on top with another user ID.

---

## Unique sessions

The number of unique sessions that unique users have created on all pages. A unique session is defined as a unique user being actively engaged with a page.

---

## Avg. page depth

Full form: Average page depth. The average number of pages that a unique user has visited during a unique session.

---

## Bounce rate

The percentage of unique sessions that contain only one page visit. An account with only one page will always have a bounce rate of 100%. This metric is more relevant for accounts with a large number of pages that are linked to each other. The length of visits is not measured by Offen. The definition of bounce is therefore rather broad. 

---

## Returning users

The number of unique users in the selected timeframe who have visited at least one page in your account in the past 6 months.

---

## Mobile users

The percentage of unique users for which the use of a mobile device is considered. Offen respects the privacy of users and therefore does not use the browser’s User Agent String in any way. Instead, a check is made to see if the device thinks it can change its orientation. If so, it is considered mobile.

---

## Avg. page load time

Full form: Average page load time. The average time it took for served pages to become interactive. In case you use a Single Page Application with client side routing only the initial page load will be measured. Subsequent navigation via `pushState` will be excluded as this metric does not apply in this scenario.

---

## Top pages

This panel displays several page lists that count the total number of page views per URL in different categories. These URLs are stripped off any querystring or hash parameters.

---

## Referrers

A list of referrer values that directed users to pages. Popular referrers like, for example, Google or Twitter display their proper name, others their domain. Referrals that are coming from the same host domain are excluded.

---

## Campaigns

A list of special referrer values that directed users to pages. For this metric, referrers will be grouped by the `utm_campaign` values contained in their querystring parameters.

---

## Sources

A list of special referrer values that directed users to pages. For this metric, referrers will be grouped by the `utm_source` values contained in their querystring parameters.

---

## Landing pages

A list of entry pages for all unique sessions. As this is collected on session level, a returning unique user might create multiple landing pages.

---

## Exit pages

A list of exit pages for all unique sessions. Only sessions with more than one pageview are taken into account. The event with the most recent timestamp is counted. As this is collected on session level, a returning unique user might create multiple exit pages.

---

## Weekly retention

This panel displays a matrix visualizing user retention over the course of the last 4 weeks. For each of the previous weeks, the percentage is calculated from the value of the current week.
