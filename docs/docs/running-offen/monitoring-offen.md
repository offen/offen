---
layout: default
title: Monitoring an Offen instance
nav_order: 8
description: "How to set up monitoring for your Offen instance"
permalink: /running-offen/monitoring-offen/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Monitoring an Offen instance
{: .no_toc }

If you want to make sure your Offen instance is always up and running by monitoring it - either yourself, or using a service such as Pingdom or similar - you can use the `/healthz/` endpoint that should always respond with a `200` status code:

```
$ curl -I https://offen.yoursite.org/healthz
HTTP/2 200 
cache-control: no-store
content-type: application/json; charset=utf-8
vary: Accept-Encoding
content-length: 11
date: Tue, 30 Jun 2020 06:33:59 GMT
```

and a payload like this:

```
$ curl -X GET https://offen.yoursite.org/healthz
{"ok":true}
```
