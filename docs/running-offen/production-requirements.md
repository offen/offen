---
layout: default
title: Production Requirements
nav_order: 2
description: "Just the Docs is a responsive Jekyll theme with built-in search that is easily customizable and hosted on GitHub Pages."
permalink: /running-offen/production-requirements
parent: Running Offen
---

# Production Requirements

In case you want to use Offen for collecting usage data in a production setup or similar, there are a few requirements to consider.

## Running the application as a service

Offen is a single binary that binds to a TCP port and listens for incoming traffic. This means that in a production setup you will need to ensure the process is always running and restarts on failure or system restart.

Choice of tools for this task depends heavily on your host OS. Alternatively, you can use the official Docker image that wraps the binary to have a unified interface across operating systems for this task.

## Running the application behind a reverse proxy

Offen itself is hardened in order to be exposed to the public internet directly. You still might want to use a reverse proxy like Apache or nginx in front of the process. This lets you leverage its buffering and caching capabilities, thus making the application easier to configure and run more smoothly in times of heavy load.

See the configuration section below for how to run Offen behind a reverse proxy.

## Usage of a subdomain

Offen uses the [Same-origin policy][sop] for protecting usage data from being accessed by third party scripts.

In a hypothetical scenario where you are using your Offen instance to collect usage data for the domain `www.mywebsite.org`, your Offen instance should be bound to a _different_ subdomain of _the same_ host domain, e.g. `offen.mywebsite.org`. This ensures that
1. usage data is readable for that domain only
1. third-party cookie restrictions do not apply

In the above scenario you would use Offen on your website by embedding the following script:

```html
<script src="https://offen.mywebsite.org/script.js" data-account-id="<YOUR_ACCOUNT_ID>"></script>
```

In case you would use the script on a website running on an entirely different host domain, usage data would be collected for users that have third party cookies enabled only.

[sop]: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

## https protocol

Offen itself __requires to be served using SSL__. This enables us to guarantee data is being transmitted without the possibility of third parties intercepting any communication. In case you do not have a SSL certificate for your Offen subdomain, you can configure Offen to automatically request and periodically renew a free certificate for the subdomain it is running on from [LetsEncrypt][lets-encrypt]. See the configuration section below for how to use this feature.

In case you do have a SSL certificate for the domain you are planning to run Offen on (e.g. a wildcard certificate for your top domain), pass the certificate's location to the runtime configuration and Offen will use the certificate. See the configuration section below for information on how to do so.

While Offen can take care of itself being run using SSL, the protocol used to serve the host document also matters, as it defines whether browsers [consider the execution context secure][secure-context] or not. This means that in case you serve your website using plain HTTP, Offen will not be able to use native cryptographic methods for encrypting usage data and will fall back to userland implementations instead. This approach is heavy and slow and is __not recommended__.

__Using SSL for your site will be benefitial regarding lots of other aspects as well.__ You can check the [LetsEncrypt website][lets-encrypt] for plenty of information on how to get free and robust SSL for any setup.

[lets-encrypt]: https://letsencrypt.org/
[secure-context]: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts

## Choosing a datastore

offen is expecting a relational datastore to be available for it to store event and account data. By default it will use a SQLite database that is simply stored on the host system.

In case you want to scale Offen or need more performance you might want to use a MySQL or Postgres database instead. See the configuration section below for how to configure dialect and database location.

## Transactional email

Offen can email you a link to reset your account's password in case you forgot it. The recommended way of doing so is configuring Offen with SMTP credentials (you might well be able to use your default mail setup here).

In case you do not configure this, Offen falls back to a local `sendmail` installation if found, yet it is very likely that these messages will never arrive at all due to system restrictions or third parties bouncing email sent using that channel.
