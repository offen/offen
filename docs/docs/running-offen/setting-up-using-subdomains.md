---
layout: default
title: Setting up and using subdomains
nav_order: 10
description: "How to configure and use subdomains for your Offen Fair Web Analytics installation"
permalink: /running-offen/setting-up-using-subdomains/
parent: Operator guide
grand_parent: Offen Fair Web Analytics
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Setting up and using subdomains
{: .no_toc }

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Same-origin policy and 1st party cookies

Offen Fair Web Analytics is designed to leverage the [Same-origin policy][sop] and usage of 1st party cookies only to make sure usage data is handled securely and protected from unwanted access by 3rd party scripts on your site or similar, at all times.

In practice, this boils down to the following setup: if you are using your Offen Fair Web Analytics instance for collecting usage data on a site `www.yoursite.org`, Offen Fair Web Analytics is expected to be served from a subdomain of `yoursite.org`, e.g. `offen.yoursite.org` or `usage.yoursite.org` (the exact name of the subdomain does not matter, although we recommend to use `offen` to make it transparent what is running). This makes sure it can securely collect usage data of all visitors that opt in to data collection.

__Heads Up__
{: .label .label-red }

Even if it would make sense, we recommend **not to use an `analytics.yoursite.org` subdomain** for your Offen Fair Web Analytics installation as these domains are often **subject to blocking by adblockers** like uBlock or similar.

---

In case you would be using a _different_ top level domain for your Offen Fair Web Analytics installation (e.g. `offen.example.com`), it would be limited to user agents that accept 3rd party cookies, which is a concept that is luckily fading away quickly.

__Heads Up__
{: .label .label-red }

You __should not try to rewrite__ your Offen Fair Web Analytics server to `www.yoursite.org/offen/` or similar. This could theoretically work with proper rewrite magic applied, but would expose usage data to 3rd party scripts. Use a subdomain instead.

[sop]: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

## A and CNAME records

The most common ways for configuring your subdomain with your DNS provider (this might be a dedicated DNS provider or it is included in your hosting package) is by setting A or CNAME records that point to your Offen Fair Web Analytics instance.

If you access your installation using an IP address you will usually set an A record, whereas a CNAME is an alias for another hostname you might be using.

Refer to your providers documentation for instructions on how to do this.

## Using one Offen Fair Web Analytics installation for multiple sites

One Offen Fair Web Analytics instance can be used to serve multiple accounts on different domains. Say for example you are using Offen Fair Web Analytics to collect usage data for multiple customers, you can point multiple DNS records to the same instance and use it for each of these customers.

E.g. if you have three sites, `www.yoursite.org`, `www.anothersite.org` and `www.somethingelse.org`, you can point the DNS records for `offen.yoursite.org`, `offen.anothersite.org` and `offen.somethingelse.org` to the same Offen Fair Web Analytics instance, allowing you to leverage the same-domain benefits for each of these sites, while still only running a single instance.

By design, consent is valid for a single domain only, so users will have to opt in for data collection on each of these domains.

When logging in, data  for all three sites will be available for you to analyze in the same session.

__Heads Up__
{: .label .label-red }

When embedding the Offen Fair Web Analytics script on sites in such a setup, __make sure it is using the correct domain__.

### Configuring AutoTLS for multiple sites

If your Offen Fair Web Analytics installation serves multiple domains, you will need to provide SSL certificates for each of them. It can acquire free and self-renewing certificates from LetsEncrypt for you when you specify these as a comma separated list in the `OFFEN_SERVER_AUTOTLS` configuration value:

```
OFFEN_SERVER_AUTOTLS="offen.yoursite.org,offen.anothersite.org,offen.somethingelse.org"
```

__Heads Up__
{: .label .label-red }

Offen Fair Web Analytics __cannot__ acquire certificates for you when it is running behind a loadbalancer. We recommend __exposing Offen Fair Web Analytics to the public internet directly, opening ports 80 and 443 and using the AutoTLS feature__.
