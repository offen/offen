---
layout: default
title: "Configuring and deploying Offen using Docker"
nav_order: 1
description: "A step by step tutorial on how to use Docker to deploy Offen."
permalink: /running-offen/tutorials/configuring-deploying-offen-docker/
parent: Installation tutorials
grand_parent: Running Offen
---

# Configuring and deploying Offen using Docker
{: .no_toc }

This tutorial walks you through the steps needed to setup and deploy a standalone, single-node Offen instance that is using a local SQLite file as its database backend.

<span class="label label-green">Note</span>
If you get stuck or need help, [file an issue][gh-issues], [tweet (@hioffen)][twitter] or [email][email].

[gh-issues]: https://github.com/offen/offen/issues
[twitter]: https://twitter.com/hioffen
[email]: mailto:hioffen@posteo.de


---

## Table of contents
{: .no_toc }

1. TOC
{:toc}


---

## Choosing a location for storing your data

In the simple setup described in this tutorial Offen needs to persist the following files:

- a database file
- a configuration file
- cache files the SSL certificates

Keeping these files available at any time is required for running the application, so make sure they are not stored on ephemeral systems. If you deploy to a ephemeral host (e.g. Heroku), check ["Configuring The Application At Runtime"][config-docs] for how to configure the application using environment variables and connecting to a remote Database.

[config-docs]: /running-offen/configuring-the-application/

---

This tutorial assumes you are on Linux, so we create a `~/.offen` directory in which we will store all data. In your `~/.offen` directory, create a `cache` directory, which will be used for caching SSL certificates, a `data` directory which will be used for storing the database and an empty file called offen.env:

```
~/.offen
├── cache
└── data
└── offen.env
```

---

## Running the `setup` command

Offen lets you setup a new instance using the `setup` command.

The value provided to the `email` flag will be your login, `name` is the name of the first account to be created. The password for your login will be requested in a prompt. Passing `-populate` will create required secrets in the `offen.env` file.

```
docker run -it --rm \
  -v ~/.offen/cache:/var/www/.cache \
  -v ~/.offen/data:/var/opt/offen \
  --mount type=bind,src=/home/you/.offen/offen.env,dst=/root/offen.env \
  offen/offen:v0.1.0-alpha.7 setup \
  -email me@mysite.com \
  -name mysite \
  -populate
```

When finished, the command has created an account for you, using the given name and credentials.

Your `offen.env` file will now look something like this:

```
OFFEN_SECRET="uNrZP7r5fY3sfS35tbzR9w==" # do not use this secret in production
```

---

__Heads Up__
{: .label .label-red }

The official Docker image is available as [`offen/offen`][docker-hub] on Docker Hub. The most recent official release is tagged as `v0.1.0-alpha.7` (which is also what the above command is using). If you are feeling adventurous, or require features that are not yet available in a release you can also use the `latest` tag which represents the latest state of development. Be aware though that these versions might be unstable.

[docker-hub]: https://hub.docker.com/r/offen/offen

---

## Setting up AutoTLS

Offen requires a secure connection and can automatically acquire a renew SSL certificates from LetsEncrypt for your domain. All you need to do is add the domain you want to serve Offen from to your `offen.env` file:

```
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
```

To make sure the automatic certificate creation and renewal works, make sure your host system exposes __both port 80 and 443__ to the public internet.

---

## Setting up email

Offen needs to send transactional email for the following features:

- Inviting a new user to an account
- Resetting your password in case you forgot it

To enable this, you can add SMTP credentials, namely __Host, User, Password and Port__ to the `offen.env` file:

```
OFFEN_SMTP_HOST="smtp.mysite.com"
OFFEN_SMTP_USER="me"
OFFEN_SMTP_PASSWORD="my-password"
OFFEN_SMTP_PORT="587"
```

---

__Heads Up__
{: .label .label-red }

Offen will run without these values being set and try to fall back to a local `sendmail` install, yet please be aware that if you rely on any of the above features email delivery will be __unreliable if not configured correctly__. You can always add this at a later time though.

---

## Verifying your config file

Before you start the application, it's a good idea to double check the setup. Your config file should now contain an entry for each of these values:

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

## Starting the application

To start Offen use the Docker image's default command:

```
docker run -d \
  -p 80:80 -p 443:443 \
  --name offen \
  -v ~/.offen/cache:/var/www/.cache \
  -v ~/.offen/data:/var/opt/offen \
  --mount type=bind,src=/home/you/.offen/offen.env,dst=/root/offen.env \
  offen/offen:v0.1.0-alpha.7
```

Once the application has started, you can use `docker ps` to check if it's up and running:

```
$ docker ps
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                    NAMES
70653aca75b4        offen/offen:v0.1.0-alpha.7   "offen"                  5 minutes ago       Up 5 minutes        80/tcp, 443/tcp          offen
```

Your instance is now ready to use. Once you have setup DNS to point at your host system, you can head to `https://offen.mysite.com/login` and login to your account.

### Stopping the application
{: .no_toc }

To stop the running container, run `stop`:

```
docker stop offen
```

### Reading logs
{: .no_toc }

To read log output, use `logs`:

```
docker logs offen
```
