---
layout: default
title: Monitoring an instance
nav_order: 13
description: "How to set up monitoring for your Offen Fair Web Analytics instance and what is being logged"
permalink: /running-offen/monitoring-offen/
parent: Operator guide
grand_parent: Offen Fair Web Analytics
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Monitoring an Offen Fair Web Analytics instance
{: .no_toc }

## Instance health

If you want to make sure your Offen Fair Web Analytics instance is always up and running by monitoring it - either yourself, or using a service such as Pingdom or similar - you can use the `/healthz/` endpoint that should always respond with a `200` status code:

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

## Log output

Offen Fair Web Analytics logs all HTTP requests to `stdout` using the [Common Log Format][clf]. Fields that contain privacy sensitive data (IPs, User-Agent Strings, Referrers) are left blank intentionally.

__Heads Up__
{: .label .label-red }

Also, all successful status codes (i.e. 200-399) will appear as `200` as caching behavior could also leak information about users. This also means the body size is stripped.

[clf]: https://en.wikipedia.org/wiki/Common_Log_Format

---

All non-access log lines will be printed to `stderr`.
