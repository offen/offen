<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Offen

## Fair web analytics

Offen is designed with the following objectives in mind:

- **Privacy friendly**: Data collection is opt in, users that do not actively opt in will never leave a trace. After opt in Offen collects the minimal amount of data needed to generate meaningful statistics for operators. No IPs, User-Agent strings or similar are being collected.
- **Secure**: Data in Offen is encrypted End-To-End. Clients encrypt usage data before it leaves the browser and there is no way for the server storing this data to decrypt it. Attackers have no means to compromise an instance, accidental data leaks cannot expose user data.
- **Self hosted and lightweight**: You can run Offen on-premises, or in any other deployment scenario that fits your need. All you need to do is download a single binary file and run it on your server. It will automatically install SSL certficates for you if you want it to. If you do not want to deploy a database, you can use SQLite to store data directly on the server.
- **Transparent and fair**: Offen treats the user as a party of equal importance in the collection of usage data. Users have access to the same set of tools for analyzing their own data and they can delete their data at any time.

---

## Storing your data

In the simple setup described in this tutorial Offen needs to read and persist the following data:

- a database file
- cache files for the SSL certificates
- a configuration file

Keeping these files available at any time is required for running the application, so make sure they are not stored on ephemeral systems. If you plan to deploy to a ephemeral host (e.g. Heroku), check ["Configuring The Application At Runtime"][config-docs] for how to configure the application using environment variables and connecting to a remote Database.

[config-docs]: /running-offen/configuring-the-application/

---

First we need to create two Docker volumes for persisiting the SQLite database and SSL certificates:

```
docker volume create offen_data
docker volume create offen_certs
```

Next, we create an empty file for holding the runtime configuration:

```
mkdir -p ~/.config
touch ~/.config/offen.env
```

__Heads Up__

Storing the config file in `~/.config/offen.env` follows an established pattern for storing such files on *ix systems, and is a good idea if you do not have any other preferences or requirements. In the end, any other location will work too though, so feel free to change this depending on your setup and needs.

---

## Running the `setup` command

Offen lets you setup a new instance using the `setup` command.

The value provided to the `email` flag will be your login, `name` is the name of the first account to be created. The password for your login will be requested in a prompt. Passing `-populate` will create required secrets in the `offen.env` file.

```
docker run -it --rm \
  -v offen_data:/var/opt/offen \
  -v offen_certs:/var/www/.cache \
  -v ~/.config/offen.env:/etc/offen/offen.env \
  offen/offen:v0.1.0-alpha.8 setup \
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

The official Docker image is available as [`offen/offen`][docker-hub] on Docker Hub. The most recent official release is tagged as `v0.1.0-alpha.8` (which is also what the above command is using). If you are feeling adventurous, or require features that are not yet available in a release you can also use the `latest` tag which represents the latest state of development. Be aware though that these versions might be unstable.

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

Offen will start without these values being set, but you will not be able to reset your password or invite new users without email being set up correctly. If you want to skip it for now, you can always add these at a later time though.

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
  -v offen_data:/var/opt/offen \
  -v offen_certs:/var/www/.cache \
  -v ~/.config/offen.env:/etc/offen/offen.env \
  offen/offen:v0.1.0-alpha.8
```

Once the application has started, you can use `docker ps` to check if it's up and running:

```
$ docker ps
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                    NAMES
70653aca75b4        offen/offen:v0.1.0-alpha.8   "offen"                  5 minutes ago       Up 5 minutes        80/tcp, 443/tcp          offen
```

Your instance is now ready to use. Once you have setup DNS to point at your host system, you can head to `https://offen.mysite.com/login` and login to your account.

### Stopping the application

To stop the running container, run `stop`:

```
docker stop offen
```

### Reading logs

To read log output, use `logs`:

```
docker logs offen
```
