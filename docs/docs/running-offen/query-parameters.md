---
layout: default
title: Using query parameters (UTM)
nav_order: 10
description: "How to better understand the traffic to your website with query parameters."
permalink: /running-offen/query-parameters/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Using query parameters (UTM)

To better understand the traffic to your website coming from links you have shared, you can add special markers to your URLs. These are then recognized by Offen as distinct referrer sources and presented separately in the Auditorium.

The two categories **Campaigns** and **Sources** are supported. They are listed in the Top Pages section in addition to Referrers and specify both Sessions and Page depth in addition to the parameter names.

## Setting up query parameters

For instance, links that are shared in e-mails or text messages often do not transmit referrer information. Therefore, the list of referrers does not show any information about them. To fix this, simply add query parameters like the following to the URLs you are sharing.

```
https://www.yourpage.org/?utm_campaign=Newsletter
```
```
https://www.yourpage.org/blog/article/?utm_source=Messenger
```
The traffic coming from these URLs is then displayed in the respective category as "Newsletter" and "Messenger".
