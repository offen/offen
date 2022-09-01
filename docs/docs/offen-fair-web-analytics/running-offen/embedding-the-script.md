---
layout: default
title: Embedding the script
nav_order: 11
description: "How to add the Offen script to your webpage."
permalink: /running-offen/embedding-the-script/
parent: Operator guide
grand_parent: Offen Fair Web Analytics
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Embedding the Offen Fair Web Analytics script
{: .no_toc }

Each page that is expected to be included in the usages statistics requires to load the Offen Fair Web Analytics script. The script needs to be configured with the Account ID you want to use for that page.

The script is served from `https://<your-installation-domain>/script.js` and can be included in any portion of your document, for example as portion of the document's `<head>`:

```html
<script async src="https://<your-installation-domain>/script.js" data-account-id="<your-account-id>"></script>
```

Your Account ID and the entire snippet can be found when you log in to the Auditorium and select the account you want use.

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

## Using Offen Fair Web Analytics with a Content-Security-Policy

If you serve your site with a [Content-Security-Policy][csp], there are a few things to consider when adding the Offen Fair Web Analytics script:

[csp]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

### `script-src`
{: .no_toc }

As the Offen Fair Web Analytics script is served from a different subdomain, you need to allow the domain as a `script-src`, i.e. `script-src 'self' https://offen.mysite.org`.

### `frame-src`
{: .no_toc }

Offen Fair Web Analytics isolates all handling of usage data in an `iframe` element so it can leverage the Same-Origin Policy to protect data from unwanted access from 3rd parties. Your Content-Security-Policy therefore needs to specify a `frame-src` like `frame-src 'self' https://offen.mysite.org`

### `style-src`
{: .no_toc }

When displaying the consent banner, Offen Fair Web Analytics injects an inline stylesheet to position the banner element on the site. This means you need to allow `unsafe-inline` styles in your Content-Security-Policy: `style-src 'self' 'unsafe-inline'`

### Minimal example
{: .no_toc }

A minimal Content-Security-Policy to use Offen Fair Web Analytics on your site could look like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' offen.mysite.org; frame-src 'self' offen.mysite.org; style-src 'self' 'unsafe-inline'
```

## Setting X-Frame-Options

Offen Fair Web Analytics relies heavily on the security and isolation features provided by running sensitive parts in an `iframe` so there is no way to "unbox" it in any way. If you want or need to use [`X-Frame-Options`][mdn-xframe] on a page that uses Offen Fair Web Analytics, you need to specifically allow the domain you are serving it from:

```
X-Frame-Options: allow-from https://offen.example.com/
```

[mdn-xframe]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options

## Triggering pageviews using the JavaScript API

When embedded as shown above, Offen Fair Web Analytics will automatically acquire a user consent decision and collect pageviews in case consent is given. If you need more fine-grained control (e.g. in the context of a user sign-up flow or similar) you can use the JavaScript API exposed by the Offen Fair Web Analytics `script` instead.

This API is not exposed by default. Embed the script passing a `data-use-api` attribute and not using `async` or `defer`:

```html
<script src="https://<your-installation-domain>/script.js" data-account-id="<your-account-id>" data-use-api></script>
```

Offen Fair Web Analytics now exposes two methods on `window.__offen__`:

### `window.__offen__.pageview([options], callback)`
{: .no_toc }

When consuming the API, you can trigger a pageview event yourself by calling the `pageview` method. It takes an optional `options` argument and an optional `callback` that will be invoked on success. In case the user has denied consent and no data is collected, the callback will be called as well. It receives an `error` argument that is `null` in case no error occured.

`options` is an object with one or more of the following boolean properties:

- `skipConsent`: when given, Offen Fair Web Analytics does not try to acquire a user consent decision in case it has not been made yet. This means data will only be collected in case the user has previously opted in. All other cases (no consent decision yet, consent denied) result in no pageview being collected.

- `subsequent`: when given, Offen Fair Web Analytics will not collect a page load time to associate with the page view. This can be used for example in single page applications where a client-side navigation does not trigger an actual pageload.

### `window.__offen__.acquireConsent(callback)`
{: .no_toc }

In case you want to trigger a consent decision without triggering a pageview, you can call this method. When a callback function is given it will be called with a single `error` argument. There is no way of telling the outcome of the consent decision (i.e. if the user has allowed or denied the collection of usage data), the error being `null` just tells you a decision happened and is persisted.

```js
window.__offen__.acquireConsent(function (err)  {
  if (err) {
    // an error occured acquiring the consent decision
    return
  }
  // a consent decision has been made
})
```

__Heads Up__
{: .label .label-red }

This API is currently under development and considered __experimental__. It does not come with __any stability guarantees__. In case you are using it check the changelog on your next upgrade. If you have any ideas about how to define this further, we are happy to learn about your feedback.
