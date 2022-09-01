---
layout: default
title: Using the Offen command
nav_order: 9
description: "Explaining subcommands and flags for the offen command."
permalink: /running-offen/using-the-command/
parent: Operator guide
---

<!--
Copyright 2020 - Offen Authors <hioffen@posteo.de>
SPDX-License-Identifier: Apache-2.0
-->

# Using the `offen` command
{: .no_toc }

Offen Fair Web Analytics is distributed as a single binary `offen` that you can download and deploy to basically any environment. Alternatively [offen/offen][] is available on Docker Hub and wraps the same command that is described here.

[offen/offen]: https://hub.docker.com/r/offen/offen

---

## Table of contents
{: .no_toc }

1. TOC
{:toc}

---

## Starting the application

Running `offen` without any arguments starts the Offen Fair Web Analytics web server, listening to the port that is configured. When deploying the application and exposing it to the internet, this will be the command you will be using.

It is also aliased as `offen serve`.

```
Usage of "serve":
  -envfile string
        the env file to use
```

## Specifying a configuration file

Every subcommand accepts a `-envfile` argument that you can use to point at your runtime configuration. In case you do not supply a value, the [default cascade][config-article] will be used for looking up this file.

[config-article]: /running-offen/configuring-the-application/

## Subcommands

__Heads Up__
{: .label .label-red }

Each subcommand can also show information about its usage when passing `-help`.

### `offen setup`

Offen Fair Web Analytics writes data to a database. `offen setup` ensures the configured database is set up correctly and populated with seed data.

```
Usage of "setup":
  -email string
        the email address used for login
  -envfile string
        the env file to use
  -force
        allow setup to delete existing data
  -forceid string
        force usage of given valid UUID as account ID (this is meant to be used in tests or similar - you probably do not want to use this)
  -name string
        the account name
  -password string
        the password used for login (must be at least 8 characters long)
  -populate
        in case required secrets are missing from the configuration, create and persist them in the target env file
  -source string
        a configuration file (this is an experimental feature - do not use it if you are not sure)
```

In case the current runtime configuration is missing required secrets, you can use the `-populate` flag and the command will generate the missing values and store them on the system, so that they get picked up when the application is run the next time.

__Heads Up__
{: .label .label-red }

If you do not want to supply your root account's password in plaintext, do not use the `-password` flag and the command will prompt for it before creating anything:

```
$ ./offen setup -email you@domain.com -name test
INFO[0000] You can now enter your password (input is not displayed):
```

### `offen secret`

Offen Fair Web Analytics requires secret random values to be provided in its runtime configuration. `offen secret` can be used to generate Base64 encoded secrets of the requested length and count.

```
Usage of "secret":
  -count int
        the number of secrets to generate (default 1)
  -length int
        the secret's length in bytes (default 16)
  -quiet
        only print secrets to stdout
```

The default length of 16 is a good default for the secrets required for configuring the application.

### `offen version`

Running `offen version` prints information about the git revision the binary has been built from.

### `offen demo`

`offen demo` starts a one-off demo instance that requires zero configuration. This is meant for anyone that wants to have a look at what Offen is offering but doesn't want to set up any configuration yet. Data is persisted in an temporary database that will be deleted once the process is shut down.

```
Usage of "demo":
  -port int
        the port to bind to (defaults to a random free port)
  -users int
        the number of users to simulate - this defaults to a random number between 250 and 500 (default -1)
```

### `offen debug`

`offen debug` prints the currently applicable runtime configuration. Use this in case Offen does end up with a configuration you do not expect. Passing a value to the `-envfile` flag will override the default lookup (just like with for example `serve` or `setup`).

```
Usage of "debug":
  -envfile string
        the env file to use
```

---

## When run as a horizontally scaling service
{: .no_toc }

The following commands are only relevant when you plan to run Offen Fair Web Analytics as a horizontally scaling service, i.e. you might have multiple instances of the application writing to and reading from the same database.

### `offen migrate`

Running `offen migrate` applies pending database migrations to the configured database. This is only necessary in case you have updated the binary installation and run it against the same database setup.

```
Usage of "migrate":
  -envfile string
        the env file to use
```

__Heads Up__
{: .label .label-red }

In case you have configured Offen Fair Web Analytics to run as a single node setup (which is the default), this will automatically be run on application startup.

### `offen expire`

Event data in Offen Fair Web Analytics is expected to expire and be pruned after six months. Running `offen expire` looks for events in the configured database that qualify for deletion and removes them. This is a destructive operation and cannot be undone.

```
Usage of "expire":
  -envfile string
        the env file to use
```

__Heads Up__
{: .label .label-red }

In case you have configured Offen Fair Web Analytics to run as a single node setup (which is the default), a job running this command will automatically be scheduled, so you will never need to run this yourself.
