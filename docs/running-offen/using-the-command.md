---
layout: default
title: Using The offen Command
nav_order: 3
description: "Explaining subcommands and flags for the offen command."
permalink: /running-offen/using-the-command/
parent: Running Offen
---

# Using the `offen` command

Offen is distributed as a single binary `offen` that you can download and deploy to basically any environment. Alternatively [offen/offen][] is available on Docker Hub and wraps the same command that is described here.

[offen/offen]: https://hub.docker.com/r/offen/offen

## Starting the application

Running `offen` without any arguments starts the actual application, listening to the port you configured. When deploying the application and exposing it to the internet, this will be the command you will be using.

It is also aliased as `offen serve`.

## Subcommands

### `offen setup`

Offen writes data to a database. `offen setup` ensures the configured database is set up correctly and populated with seed data.

```
Usage of setup:
  -email string
        the email address used for login
  -envfile string
        the env file to use
  -forceid string
        force usage of given account id
  -name string
        the account name
  -password string
        the password used for login
  -populate
        in case required secrets are missing from the configuration, create and persist them in the target env file
  -source string
        the configuration file
```

In case the current runtime configuration is missing required secrets, you can use the `-populate` flag and the command will generate the missing values and store them on the system so that they get picked up when the application is run the next time.

If you do not want to supply your root account's password in plaintext, omit the `-password` flag and the command will prompt for it before creating anything:

```
$ ./offen setup -email you@domain.com -name test
INFO[0000] You can now enter your password (input is not displayed):
```

### `offen secret`

Offen requires secret random values to be provided in its runtime configuration. `offen secret` can be used to generate Base64 encoded secrets of the requested length and count.

```
Usage of secret:
  -count int
        the number of secrets to generate (default 1)
  -length int
        the length in bytes (default 16)
```

The default length of 16 is a good default for the secrets required for configuring the application.

### `offen version`

Running `offen version` prints information about the git revision the binary has been built from.

### `offen demo`

`offen demo` starts a one-off demo instance that requires zero configuration. This is meant for anyone that wants to have a look at what Offen is offering but doesn't want to set up any configuration yet. Data is persisted in an in-memory database that will be deleted once the process is shut down.

---

## When run as a horizontally scaling service

These commands are only relevant when you plan to run offen as a horizontally scaling service, i.e. you might have multiple instances of the application writing to and reading from the same database.

### `offen migrate`

Running `offen migrate` applies pending database migrations to the configured database. This is only necessary in case you have updated the binary installation and run it against the same database setup.

In case you have configured Offen to run as a single node setup (which is the default), this will automatically be run on application startup.

### `offen expire`

Event data in Offen is expected to expire and be pruned after a defined timeframe (the default value is half a year). Running `offen expire` looks for events in the configured database that qualify for deletion and removes them. This is a destructive operation and cannot be undone.

In case you have configured Offen to run as a single node setup (which is the default), a job running this command will automatically be scheduled, so you will never need to run this yourself.
