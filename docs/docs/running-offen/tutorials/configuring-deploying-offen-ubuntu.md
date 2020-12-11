---
layout: default
title: "Configuring and deploying Offen on Ubuntu using Systemd"
nav_order: 2
description: "A step by step tutorial on how to deploy Offen on an Ubuntu system using systemd."
permalink: /running-offen/tutorials/configuring-deploying-offen-ubuntu/
parent: Installation tutorials
grand_parent: Running Offen
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Configuring and deploying Offen on Ubuntu
{: .no_toc }

This tutorial walks you through the steps needed to setup and deploy a standalone, single-node Offen instance that is using a local SQLite file as its database backend. `systemd` is used for managing the Offen service.

<span class="label label-green">Note</span>
If you get stuck or need help, [file an issue][gh-issues], [tweet (@hioffen)][twitter] or [email][email]. If you have installed Offen and would like to spread the word, we're happy to feature you in our README. [Send a PR][edit-readme] adding your site or app and we'll merge it.

[gh-issues]: https://github.com/offen/offen/issues
[twitter]: https://twitter.com/hioffen
[email]: mailto:hioffen@posteo.de
[edit-readme]: https://github.com/offen/offen/edit/development/README.md

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Prerequisites

This tutorial assumes the machine you are planning to run Offen on is connected to the internet and has DNS records for `offen.mysite.com` (or the domain you are actually planning to use) pointing to it. Ports 80 and 443 are expected to be accessible to the public. See the [documentation for subdomains][domain-doc] for further information on this topic.

[domain-doc]: ./../setting-up-using-subdomains/

## Downloading and installing the package

Offen version v0.1.6 and later is packaged as a Debian package, so installation on Ubuntu (and other Debian based distributions) is easy. First, download the package for the latest release:

```
curl -sSL https://get.offen.dev/deb -o offen.deb
```

Next, you can verify the package's signature using `gpg` and `dpkg-sig` (this step is optional, but recommended):
```
curl https://keybase.io/hioffen/pgp_keys.asc | gpg --import
dpkg-sig --verify offen.deb
```

The package itself can be installed using `dpkg`:

```
sudo dpkg -i offen.deb
```

You can confirm that your installation is working as expected like this:
```
$ which offen
/usr/local/bin/offen
$ offen version
INFO[0000] Current build created using                   revision={{ site.offen_version }}
```

You can now safely remove the download:

```
rm offen.deb
```

[releases]: https://github.com/offen/offen/releases

---

## Configuring Offen

In this setup, Offen stores its runtime configuration in `/etc/offen/offen.env`. This file has already been created on installation, so you can now populate it with the values required for your install.

### Application Secret

Offen is using a secret to sign login cookies and tokens for resetting passwords or inviting users. You can generate a unique secret for your installation using the `offen secret` subcommand:

```
$ offen secret
INFO[0000] Created 16 bytes secret                       secret="S2dR9JYYTNG3+5QN+jxiwA=="
```

Populate the `OFFEN_SECRET` key with the value you just generated:

```
OFFEN_SECRET="S2dR9JYYTNG3+5QN+jxiwA==" # do not use this secret in production
```

__Heads Up__
{: .label .label-red }

If you do not set this config value, Offen will generate a random one every time it starts up. This means it works securely, yet all login sessions, password reset emails or invitations will be invalidated when the service restarts.

### Setting up AutoTLS

Offen requires a secure connection and can automatically acquire a renew SSL certificates from LetsEncrypt for your domain. Add the domain you want to use to serve Offen to `OFFEN_SERVER_AUTOTLS`:

```
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
```

To make sure the automatic certificate creation and renewal works, make sure your host system exposes __both port 80 and 443__ to the public internet.

### Setting up email

Offen needs to send transactional email for the following features:

- Inviting a new user to an account
- Resetting your password in case you forgot it

To enable this, you can add SMTP credentials, namely __Host, Sender, User, Password and Port__ to the `offen.env` file:

```
OFFEN_SMTP_HOST="smtp.mysite.com"
OFFEN_SMTP_SENDER="offen@mysite.com"
OFFEN_SMTP_USER="me"
OFFEN_SMTP_PASSWORD="my-password"
OFFEN_SMTP_PORT="587"
```

__Heads Up__
{: .label .label-red }

Offen will run without these values being set and try to fall back to a local `sendmail` install, yet please be aware that if you rely on any of the above features email delivery will be __very unreliable if not configured correctly__. You can always add this at a later time though.

---

### Verifying your config file

Before you start the application, it's a good idea to double check the setup. Your config file at `/etc/offen/offen.env` should now contain an entry for each of these values:

```
OFFEN_SECRET="uNrZP7r5fY3sfS35tbzR9w==" # do not use this secret in production
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
OFFEN_SMTP_HOST="smtp.mysite.com"
OFFEN_SMTP_USER="me"
OFFEN_SMTP_PASSWORD="my-password"
OFFEN_SMTP_PORT="587"
```

If all of this is populated with the values you expect, you're ready to use Offen.

---

## Starting the `systemd` service

`systemd` is used to make sure Offen is up and running at all times (e.g. after rebooting or crashing) and accepts events. The `deb` package has already creating a `systemd` service for you on installation, so all you need to do now is start it:

```
sudo systemctl enable offen
sudo systemctl start offen
```

You can check whether this worked correctly using `status:`

```
$ sudo systemctl status offen
● offen.service - Offen Service
   Loaded: loaded (/etc/systemd/system/offen.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2020-01-27 15:57:58 CET; 1min ago
 Main PID: 6701 (offen)
    Tasks: 11 (limit: 4915)
   CGroup: /system.slice/offen.service
           └─6701 /usr/local/bin/offen
```


Your instance is now ready to use.

---

## Setting up the instance

Now that Offen is up and running, you can create your login user and a first account by navigating to `https://offen.mysite.com/setup`. You can create one user and one account here, but you can always add more later on.

After submitting the form, your Offen instance is ready to use.

## Maintenance

### Accessing logs

The easiest way for accessing application logs in this setup is using `journald`

```
$ sudo journalctl -u offen
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Successfully applied database migrations"
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Server now listening on port 80 and 443 using AutoTLS"
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Cron successfully pruned expired events" removed=0
```

### Uninstalling the service

If you want to uninstall the service from your system, stop and disable the `offen` service:

```
sudo systemctl stop offen
sudo systemctl disable offen
```

### Updating the version in use

To update to a new version of Offen, download the package for the newer version and install:

```
curl https://get.offen.dev/deb -o offen.deb
dpkg-sig --verify offen.deb
sudo dpkg -i offen.deb
```

Confirm that this worked by having `offen` print its updated version:

```
$ offen version
INFO[0000] Current build created using                   revision=v0.2.12
```

You can now restart your service to pick up the changes:

```
sudo systemctl restart offen
```
