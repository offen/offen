---
layout: default
title: Configuring the application
nav_order: 5
description: "How to configure an Offen instance at runtime."
permalink: /running-offen/configuring-the-application/
parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Configuring the application at runtime
{: .no_toc }

At runtime, __Offen is configured using environment variables__. All variables are following the pattern of `OFFEN_<scope>_<key>` (e.g. `OFFEN_SERVER_PORT`).

In addition to setting variables in the host environment __Offen also supports setting these values through [`env` files][dotenv]__.

[dotenv]: https://github.com/joho/godotenv

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Lookup order of .env files

### On Linux and MacOS
{: .no_toc }

In case the `-envfile` flag was supplied with a value when invoking a command, Offen will use this file. In case no such flag was given, Offen looks for files named `offen.env` in the following locations:

- In the current working directory
- In `~/.config`
- In `$XDG_CONFIG_HOME`
- In `/etc/offen`

### On Windows
{: .no_toc }

In case the `-envfile` flag was supplied with a value when invoking a command, Offen will use this file. In case no such flag was given, Offen expects a file named `offen.env` to be present in the current working directory.

## Configuration format

`env` files will specify the same keys the environment variables use, e.g.:

```
OFFEN_SERVER_PORT="4000"
OFFEN_DATABASE_DIALECT="sqlite3"
OFFEN_DATABASE_CONNECTIONSTRING="/opt/offen/data/db.sqlite"
```

---

## Configuration options

### HTTP server

The `SERVER` namespace collects settings that affect the behavior of the HTTP server that is serving the application.

### OFFEN_SERVER_PORT
{: .no_toc }

Defaults to `3000`.

The port the application listens on.

__Heads Up__
{: .label .label-red }

The Docker image sets this value to 80 in the Dockerfile, so you cannot override it from within an env file. Instead, map port 80 in the container to the desired port on your host system.

### OFFEN_SERVER_REVERSEPROXY
{: .no_toc }

Defaults to `false`.

If set to `true` the application will assume it is running behind a reverse proxy. This means it does not add caching or security related headers to any response. Logging information about requests to `stdout` is also disabled.

### OFFEN_SERVER_SSLCERTIFICATE
{: .no_toc }

In case you own a SSL certificate that is valid for the domain you are planning to serve your Offen instance from, you can pass the location of the certificate file using this variable. It also requires `OFFEN_SERVER_SSLKEY` to be set.

### OFFEN_SERVER_SSLKEY
{: .no_toc }

In case you own a SSL certificate that is valid for the domain you are planning to serve your Offen instance from, you can pass the location of the key file using this variable. It also requires `OFFEN_SERVER_SSLCERTIFICATE` to be set.

### OFFEN_SERVER_AUTOTLS
{: .no_toc }

In case you want Offen to automatically request a free SSL certificate from LetsEncrypt you can use this parameter and assign a comma separated list of supported domain names (e.g. `offen.mydomain.org,offen.otherdomain.org`) you are planning to serve Offen from. This will have the application automatically handle certificate issuing and renewal.

__Heads Up__
{: .label .label-red }

Using this feature will invalidate any port value that has been configured and will make Offen listen to both port 80 and 443. In such a setup, it is important that both ports are available to the public internet.

### OFFEN_SERVER_CERTFICATECACHE
{: .no_toc }

Defaults to `/var/www/.cache` on Linux and MacOS, `%Temp%\offen.db` on Windows.

When using the AutoTLS feature, this sets the location where Offen will be caching certificates.

__Heads Up__
{: .label .label-red }

It is important that this value points to a persistent, non-ephemeral location as otherwise each request would issue a new certificate and your deployment will be rate limited by Let's Encrypt soon.

### OFFEN_SERVER_LETSENCRYPTEMAIL
{: .no_toc }

In case you are using the AutoTLS feature, this setting can be used to pass an email to Let's Encrypt that will then be associated with the issued certificate. This allows Let's Encrypt to email you on certificate expiry or other possible issues with the certificate.

---

### Database

The `DATABASE` namespace collects settings regarding the connected persistence layer. If you do not configure any of these, Offen will be able to start, but data will not persist as it will be saved into a local temporary database.

### OFFEN_DATABASE_DIALECT
{: .no_toc }

Defaults to `sqlite3`.

The SQL dialect to use. Supported options are `sqlite3`, `postgres` or `mysql`.

### OFFEN_DATABASE_CONNECTIONSTRING
{: .no_toc }

Defaults to `/var/opt/offen/offen.db` on Linux and MacOS, `%Temp%\offen.db` on Windows.

The connection string or location of the database. For `sqlite3` this will be the location of the database file, for other dialects, it will be the URL the database is located at, __including the credentials__ needed to access it.

When using `mysql` make sure you append a `?parseTime=true` parameter to your connection string:

```
OFFEN_DATABASE_CONNECTIONSTRING=user:pass@tcp(localhost:3306)/offen?parseTime=true
```

When using `postgres` and you are using a local database (or a Docker network) you might need to append a `?sslmode=disable` parameter to your connection string:

```
OFFEN_DATABASE_CONNECTIONSTRING=postgres://user:pass@localhost:5432/offen?sslmode=disable
```

### OFFEN_DATABASE_CONNECTIONRETRIES
{: .no_toc }

Defaults to `0`.

When running in a setup where you start the Offen server together with your database, you might run into race scenarios where Offen tries to connect to your database before it's ready to accept connections (e.g. docker-compose with MySQL). If needed, you can use this setting to tell Offen to retry connecting to the database after sleeping for a few seconds. This mechanism uses an exponential backoff algorithm, so if you specify a large number, the intervals might become big.

As this is more of a workaround, the __default behavior is not to retry__.

---

### Email

`SMTP` is a namespace used for configuring how transactional email is being sent. If any of these values is missing, Offen will fallback to using local `sendmail` which will likely be unreliable, so **configuring these values is highly recommended**.

### OFFEN_SMTP_USER
{: .no_toc }

No default value.

The SMTP user name used when sending transactional email.

### OFFEN_SMTP_PASSWORD
{: .no_toc }

No default value.

The SMTP user name used when sending transactional email.

### OFFEN_SMTP_HOST
{: .no_toc }

No default value.

The SMTP hostname used when sending transactional email.

### OFFEN_SMTP_PORT
{: .no_toc }

Default value `587`.

The SMTP port used when sending transactional email.

### OFFEN_SMTP_SENDER
{: .no_toc }

Default value `no-reply@offen.dev`.

The From address used when sending transactional email.

---

### Secrets

`OFFEN_SECRET` is a single value.

### OFFEN_SECRET
{: .no_toc }

No default value.

A Base64 encoded secret that is used for signing cookies and validating URL tokens. Ideally, it is of 16 bytes length. __If this is not set, a random value will be created at application startup__. This would mean that Offen can serve requests, but __an application restart would invalidate all existing sessions and all pending invitation/password reset emails__. If you do not want this behavior, populate this value, which is what we recommend.

---

__Heads Up__
{: .label .label-red }

The `offen` command has a `secret` subcommand you can use to generate such a value:

```
$ offen secret
INFO[0000] Created 16 bytes secret                       secret="NYOBGx2wF3CdrTva16m6BQ=="
```

Please __do not use the above example value__ when deploying your application.

---

### Application

The `APP` namespace affects how the application will behave.

### OFFEN_APP_LOCALE
{: .no_toc }

Defaults to `en`.

The language the application will use when displaying user facing text. Right now, `en` (English), `de` (German), `fr` (French), `es` (Spanish), `pt` (Portuguese) and `vi` (Vietnamese) are supported. In case you want to contribute to Offen by adding a new language, [we'd love to hear from you][email].

[email]: mailto:hioffen@posteo.de

### OFFEN_APP_LOGLEVEL
{: .no_toc }

Defaults to `info`.

Specifies the application's log level. Possible values are `debug`, `info`, `warn`, `error`. If you use a level higher than `info`, access logging - which is happening at `info` level - will be suppressed.

### OFFEN_APP_SINGLENODE
{: .no_toc }

Defaults to `true`.

In case you want to run Offen as a horizontally scaling service, you can set this value to `false`. This will disable all cron jobs and similar that handle automated database migration and event expiration.

### OFFEN_APP_ROOTACCOUNT
{: .no_toc }

No default value.

If you want to collect usage statistics for your Offen Fair Web Analytics installation using Offen, you can use this parameter to specify an Account ID known to your Offen instance that will be used for collecting data.

### OFFEN_APP_RETENTION
{: .no_toc }

Defaults to `6months`

By default, Offen retains data for 6 months (186 days) and deletes all data that is older than this threshold.
In case you wish to expire data even earlier, use this setting to define a shorter retention period.
Possible values are:

- `6months`
- `12weeks`
- `6weeks`
- `30days`
- `7days`

__Heads Up__
{: .label .label-red }

Please note that when you configure this value to be lower than what was usedbefore, __the application will delete all events older than the new value on startup__, and there will be __no way to recover this data__.
