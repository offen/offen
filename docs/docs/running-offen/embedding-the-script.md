---
layout: default
title: Embedding the Offen script
nav_order: 7
description: "How to add the Offen script to your webpage."
permalink: /running-offen/embedding-the-script/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Embedding the Offen script

Each page that is expected to be included in the usages statistics requires to load the Offen script. The script needs to be configured with the Account ID you want to use for that page.

The script is served from `https://<your-installation-domain>/script.js` and can be included in any portion of your document, for example as portion of the document's `<head>`:

```html
<script async src="https://<your-installation-domain>/script.js" data-account-id="<your-account-id>"></script>
```

Your Account ID and the entire snippet can be found when you log in to the Auditorium and select the account you want use.

## Using Offen with a Content-Security-Policy

If you serve your site with a [Content-Security-Policy][csp], there are a few things to consider when adding the Offen script:

[csp]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

### `script-src`

As the Offen script is served from a different subdomain, you need to allow the domain as a `script-src`, i.e. `script-src 'self' https://offen.mysite.org`.

### `frame-src`

Offen isolates all handling of usage data in an `iframe` element so it can leverage the Same-Origin Policy to protect data from unwanted access from 3rd parties. Your Content-Security-Policy therefore needs to specify a `frame-src` like `frame-src 'self' https://offen.mysite.org`

### `style-src`

When displaying the consent banner, Offen injects an inline stylesheet to position the banner element on the site. This means you need to allow `unsafe-inline` styles in your Content-Security-Policy: `style-src 'self' 'unsafe-inline'`

### Minimal example

A minimal Content-Security-Policy to use Offen on your site could look like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' offen.mysite.org; frame-src 'self' offen.mysite.org; style-src 'self' 'unsafe-inline'
```
