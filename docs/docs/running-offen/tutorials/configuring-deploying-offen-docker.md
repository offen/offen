---
layout: default
title: Installation with Docker
nav_order: 1
description: "A step by step tutorial on how to use Docker to deploy Offen."
permalink: /running-offen/tutorials/configuring-deploying-offen-docker/
parent: For operators
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Installation with Docker

Configuring and deploying Offen Fair Web Analytics using Docker
{: .no_toc }

This tutorial walks you through the steps needed to setup and deploy a standalone, single-node Offen Fair Web Analytics instance that is using SQLite file as its database backend.

<span class="label label-green">Note</span>

If you get stuck or need help, [file an issue][gh-issues], or send an [email][email]. If you have installed Offen Fair Web Analytics and would like to spread the word, we're happy to feature you in our README. [Send a PR][edit-readme] adding your site or app and we'll merge it.

[gh-issues]: https://github.com/offen/offen/issues
[email]: mailto:hioffen@posteo.de
[edit-readme]: https://github.com/offen/offen/edit/development/README.md


---

## Table of contents
{: .no_toc }

1. TOC
{:toc}


---

## Prerequisites

Apart from having already installed Docker, this tutorial assumes the machine you are planning to run Offen Fair Web Analytics on is connected to the internet and has DNS records for `offen.example.com` (or the domain you are actually planning to use) pointing to it. Ports 80 and 443 are expected to be accessible to the public. See the [documentation for subdomains][domain-doc] for further information on this topic.

[domain-doc]: ../../setting-up-using-subdomains/

## Storing your data

In the simple setup described in this tutorial Offen Fair Web Analytics needs to read and persist the following data:

- a database file
- cache files for the SSL certificates
- a configuration file

Keeping these files available at any time is required for running the application, so make sure they are not stored on ephemeral systems. If you plan to deploy to a ephemeral host (e.g. Heroku), check ["Configuring The Application At Runtime"][config-docs] for how to configure the application using environment variables and connecting to a remote Database.

[config-docs]: ../../configuring-the-application/

---

First we need to create two Docker volumes for persisting the SQLite database and SSL certificates:

```
docker volume create offen_data
docker volume create offen_certs
```

Next, we create an empty file for holding the runtime configuration:

```
mkdir -p ~/.config
touch ~/.config/offen.env
sudo chown 10000:10001 ~/.config/offen.env
```

__Heads Up__
{: .label .label-red }

Storing the config file in `~/.config/offen.env` follows an established pattern for storing such files on *ix systems, and is a good idea if you do not have any other preferences or requirements. In the end, any other location will work too though, so feel free to change this depending on your setup and needs.

---

## Running the `setup` command

Offen Fair Web Analytics lets you setup a new instance using the `setup` command.

The value provided to the `email` flag will be your login, `name` is the name of the first account to be created. The password for your login will be requested in a prompt. Passing `-populate` will create required secrets in the `offen.env` file.

```
docker run -it --rm \
  -v offen_data:/var/opt/offen \
  -v offen_certs:/var/www/.cache \
  -v ~/.config/offen.env:/etc/offen/offen.env \
  offen/offen:{{ site.offen_version }} setup \
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

The official Docker image is available as [`offen/offen`][docker-hub] on Docker Hub. If you are feeling adventurous, or require features that are not yet available in an official release you can also use the `latest` tag which represents the latest state of development. Be aware though that these versions might be unstable.

[docker-hub]: https://hub.docker.com/r/offen/offen

---

## Setting up AutoTLS

Offen Fair Web Analytics requires a secure connection and can automatically acquire a renew SSL certificates from LetsEncrypt for your domain. All you need to do is add the domain you want to serve Offen Fair Web Analytics from to your `offen.env` file:

```
OFFEN_SERVER_AUTOTLS="offen.mysite.com"
```

To make sure the automatic certificate creation and renewal works, make sure your host system exposes __both port 80 and 443__ to the public internet.

---

## Setting up email

Offen Fair Web Analytics needs to send transactional email for the following features:

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

Offen Fair Web Analytics will start without these values being set, but you will not be able to reset your password or invite new users without email being set up correctly. If you want to skip it for now, you can always add these at a later time though.

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

If all of this is populated with the values you expect, you're ready to use Offen Fair Web Analytics.

---

## Starting the application

To start Offen Fair Web Analytics use the Docker image's default command:

```
docker run -d \
  -p 80:80 -p 443:443 \
  --name offen \
  -v offen_data:/var/opt/offen \
  -v offen_certs:/var/www/.cache \
  -v ~/.config/offen.env:/etc/offen/offen.env \
  offen/offen:{{ site.offen_version }}
```

Once the application has started, you can use `docker ps` to check if it's up and running:

```
$ docker ps
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                    NAMES
70653aca75b4        offen/offen:{{ site.offen_version }}   "offen"                  5 minutes ago       Up 5 minutes        80/tcp, 443/tcp          offen
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

---

## Bonus: Example docker-compose setups

docker-compose is an ubiquitous tool for handling multi container setups. Below you will find templates to use for deploying Offen Fair Web Analytics alongside a database. Alternatively, check out our [template repository][deploy-template] which we use to deploy it ourselves.

[deploy-template]: https://github.com/offen/deployment

### Using a SQLite database

```
version: '3'

services:
  offen:
    image: offen/offen:{{ site.offen_version }}
    env_file: ./offen.env
    ports:
      - 80:80
      - 443:443
    volumes:
     - data:/var/opt/offen
     - certs:/var/www/.cache

volumes:
  data:
  certs:
```

### Using a MariaDB / MySQL database

```
version: '3'

services:
  offen:
    image: offen/offen:{{ site.offen_version }}
    ports:
      - 80:80
      - 443:443
    env_file: ./offen.env
    environment:
      OFFEN_DATABASE_DIALECT: mysql
      OFFEN_DATABASE_CONNECTIONSTRING: root:password@tcp(mysql:3306)/offen?parseTime=true
      OFFEN_DATABASE_CONNECTIONRETRIES: 10
    volumes:
      - certs:/var/www/.cache
    depends_on:
      - mysql

  mysql:
    image: mariadb:5
    volumes:
      - data:/var/lib/mysql
    environment:
      MYSQL_DATABASE: offen
      # check the documentation for MYSQL_ROOT_PASSWORD_FILE for
      # how to avoid putting the password in here
      MYSQL_ROOT_PASSWORD: password

volumes:
  data:
  certs:
```

### Using a Postgres database

```
version: '3'

services:
  offen:
    image: offen/offen:{{ site.offen_version }}
    ports:
      - 80:80
      - 443:443
    env_file: ./offen.env
    environment:
      OFFEN_DATABASE_DIALECT: postgres
      OFFEN_DATABASE_CONNECTIONSTRING: postgres://user:password@postgres:5432/offen?sslmode=disable
      OFFEN_DATABASE_CONNECTIONRETRIES: 10
    volumes:
      - certs:/var/www/.cache
    depends_on:
      - postgres

  postgres:
    image: postgres:12-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_DB: offen
      # check the documentation for POSTGRES_PASSWORD_FILE for
      # how to avoid putting the password in here
      POSTGRES_PASSWORD: password
    volumes:
      - data:/var/lib/postgresql/data

volumes:
  data:
  certs:
```
