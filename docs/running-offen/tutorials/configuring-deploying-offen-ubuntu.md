---
layout: default
title: "Configuring and Deploying Offen on Ubuntu using systemd"
nav_order: 2
description: "A step by step tutorial on how to deploy Offen on an Ubuntu system using systemd."
permalink: /running-offen/tutorials/configuring-deploying-offen-ubuntu/
parent: Installation Tutorials
grand_parent: Running Offen
---

# Configuring and Deploying Offen on Ubuntu
{: .no_toc }

This tutorial walks you through the steps needed to setup and deploy a standalone, single-node Offen instance that is using a local SQLite file as its database backend. `systemd` is used for managing the Offen service.

<span class="label label-green">Note</span>
If you get stuck or need help, [file an issue][gh-issues], [tweet (@hioffen)][twitter] or [email][email].

[gh-issues]: https://github.com/offen/offen/issues
[twitter]: https://twitter.com/hioffen
[email]: mailto:hioffen@posteo.de

---

## Table of Contents
{: .no_toc }

1. TOC
{:toc}

---

## Downloading and Installing the binaries

You can download a tarball of the latest release from our [Releases section on GitHub][releases].

In this tutorial, we will put the binaries for each version in a directory in `/opt/offen/<version>` and create a symlink for the version you want to use in `/usr/bin`. This allows you to update your binaries without interrupting the service.

Start by creating the `/opt/offen` directory:

```
sudo mkdir -p /opt/offen
```

Untar the archive you downloaded and look for the binary called `offen-linux-amd64`. Put this file in a subdirectory of `/opt/offen` that specifies its version. This example is using the `v0.1.0-alpha.3` release:

```
mkdir -p /tmp/offen-download && cd /tmp/offen-download
curl -L https://get.offen.dev | tar -xvz
md5sum -c checksums.txt # check that your download contains the expected files
sudo mkdir -p /opt/offen/v0.1.0-alpha.3
sudo cp offen-linux-amd64 /opt/offen/v0.1.0-alpha.3
sudo ln -s /opt/offen/v0.1.0-alpha.3/offen-linux-amd64 /usr/bin/offen
```

You can confirm that your installation is working as expected like this:

```
$ which offen
/usr/bin/offen
$ offen version
INFO[0000] Current build created using                   revision=v0.1.0-alpha.3
```

---

## Choosing a Location for Storing Your Data

In the simple setup described in this tutorial Offen needs to persist the following files:

- a database file
- a configuration file
- cache files the SSL certificates

Keeping these files available at any time is required for running the application, so make sure they aren't stored on ephemeral systems. If you deploy to a ephemeral host (e.g. Heroku), check ["Configuring The Application At Runtime"][config-docs] for how to configure the application using environment variables and connecting to a remote Database.

[config-docs]: /running-offen/configuring-the-application/

---

This tutorial assumes you are able to use `sudo`, so we create a `/var/opt/offen` directory in which we will store our database.

```
sudo mkdir -p /var/opt/offen
```

In your `/var/www` directory, create a `.cache` directory if it doesn't already exist.

```
sudo mkdir -p /var/www/.cache
```

In your `/etc` directory create an `offen` directory and populate it with an empty file called `offen.env`. This will hold your application configuration.

```
sudo mkdir -p /etc/offen && sudo touch /etc/offen/offen.env
```

---

## Running the `setup` Command

Now that we have defined the database location, Offen lets you setup a new instance using the `setup` command:

```
sudo offen setup \
  -email me@mysite.com \ # the email used for login
  -name mysite \ # your account name, this will not be displayed to users
  -populate # this will automatically create required secrets for you
```

When finished, the command has created an account for you, using the given name and credentials.

Your `/etc/offen/offen.env` file will now look something like this:

```
OFFEN_SECRETS_COOKIEEXCHANGE="uNrZP7r5fY3sfS35tbzR9w==" # do not use this secret in production
```

---

## Setting up AutoTLS

Offen requires a secure connection and can automatically acquire a renew SSL certificates from LetsEncrypt for your domain. All you need to do is add the domain you want to serve Offen from to your `/etc/offen/offen.env` file:

```
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
```

To make sure the automatic certificate creation and renewal works, make sure your host system exposes __both port 80 and 443__ to the public internet.

---

## Setting up Email

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

---

__Heads Up__
{: .label .label-red }

Offen will run without these values being set and try to fall back to a local `sendmail` install, yet please be aware that if you rely on any of the above features email delivery will be __very unreliable if not configured correctly__. You can always add this at a later time though.

---

## Verifying your config file

Before you start the application, it's a good idea to double check the setup. Your config file at `/etc/offen/offen.env` should now contain an entry for each of these values:

```
OFFEN_SECRETS_COOKIEEXCHANGE="uNrZP7r5fY3sfS35tbzR9w==" # do not use this secret in production
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
OFFEN_SMTP_HOST="smtp.mysite.com"
OFFEN_SMTP_USER="me"
OFFEN_SMTP_PASSWORD="my-password"
OFFEN_SMTP_PORT="587"
```

If all of this is populated with the values you expect, you're ready to use Offen.

---

## Creating and Running a `systemd` Service

If you want to expose Offen to the internet, you need some other process to supervise it and restart it on failure or reboot. This tutorial uses `systemd` to do so for it ubiquity, but if you prefer any other tool to handle this for you it should work just as fine.

First, create a service definiton in `/etc/systemd/system/offen.service`:

```sh
sudo touch /etc/systemd/system/offen.service
```

and populate it with the following content:

```
[Unit]
Description=Offen Service

[Service]
ExecStart=/usr/bin/offen
Restart=always

[Install]
WantedBy=multi-user.target
```

This means you can now register the service with `systemd`:

```
sudo systemctl daemon-reload
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
           └─6701 /usr/bin/offen
```


Your instance is now ready to use. Once you have setup DNS to point at your host system, you can head to `https://offen.mysite.com/login` and login to your account.

---

### Accessing Logs for the Service
{: .no_toc }

The easiest way for accessing application logs in this setup is using `journald`

```
$ sudo journalctl -u offen
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Successfully applied database migrations"
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Server now listening on port 80 and 443 using AutoTLS"
offen[6573]: time="2020-01-27T15:57:41+01:00" level=info msg="Cron successfully pruned expired events" removed=0
```

### Uninstalling the Service
{: .no_toc }

If you want to uninstall the service from your system, stop and disable the `offen` service:

```
sudo systemctl stop offen
sudo systemctl disable offen
```

## Updating the Version in Use

To update to a new version of Offen, download the contents of the newest release into a new directory in `/opt/offen` and update the symlink in `/usr/bin`:

```
curl -L https://get.offen.dev | tar -xvz
md5sum -c checksums.txt # check that your download contains the expected files
sudo mkdir -p /opt/offen/v0.1.0-alpha.4
sudo cp offen-linux-amd64 /opt/offen/v0.1.0-alpha.4
sudo ln -s /opt/offen/v0.1.0-alpha.4/offen-linux-amd64 /usr/bin/offen
```

Confirm that this worked by having `offen` print its version:

```
$ offen version
INFO[0000] Current build created using                   revision=v0.1.0-alpha.4
```

You can now restart your service to pick up the changes:

```
sudo systemctl restart offen
```

---

__Heads Up__
{: .label .label-red }

At the moment __Offen is alpha stage software__. We are working hard to keep things stable for our users, but at the moment we cannot guarantee upgrade compatibility. Check the changelogs carefully to see if you can actually upgrade to a new release before replacing your running version.

You can read more about our approach to versioning in [this blog post][versioning-blog].

[releases]: https://github.com/offen/offen/releases
[versioning-blog]: https://www.offen.dev/blog/untold-roads-versioning-early-stage-software/
