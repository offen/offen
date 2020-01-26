[![CircleCI](https://circleci.com/gh/offen/offen/tree/development.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/development)
[![Patreon](https://img.shields.io/static/v1.svg?label=patreon&message=donate&color=e85b46)](https://www.patreon.com/offen)

# Offen

## Web analytics that handle your data with respect

Offen is designed with the following objectives in mind:

- **Privacy friendly**: Data collection is opt in, users that do not actively opt in will never leave a trace. After opt in Offen collects the minimal amount of data needed to generate meaningful statistics for operators. No IPs, User-Agent strings or similar are being collected.
- **Secure**: Data in Offen is encrypted End-To-End. Clients encrypt usage data before it leaves the browser and there is no way for the server storing this data to decrypt it. Attackers have no means to compromise an instance, accidental data leaks cannot expose user data.
- **Self hosted and lightweight**: You can run Offen on-premises, or in any other deployment scenario that fits your need. All you need to do is download a single binary file and run it on your server. It will automatically install SSL certficates for you if you want it to. If you do not want to deploy a database, you can use SQLite to store data directly on the server.
- **Transparent and fair**: Offen treats the user as a party of equal importance in the collection of usage data. Users have access to the same set of tools for analyzing their own data and they can delete their data at any time.

If you're curious, give it a test drive right now:

```sh
docker run --rm -it -p 9876:9876 offen/offen:latest demo -port 9876
```

This creates ephemeral one-off installation running on `http://localhost:9876`.

---

**IMPORTANT NOTE BEFORE YOU START**: Offen is in the early stages of its development. We're happy if you would like to experiment with using it, but at this point in time we cannot guarantee any upgrade stability. Each release might contain breaking changes that might result in data being lost on the next upgrade.


This repository contains all source code needed to build and run Offen, both on the server as well as on the client. Also see each of the READMEs in the subdirectories for information on how to work on that particular area of the application.

__Documentation on developing, running and using Offen__ is currently being collected in our [wiki][].

[wiki]: https://github.com/offen/offen/wiki

---

### Project status

We are currently working on __Milestone 2 out of 6: Collecting data securely__. Check our [blog][] for detailed updates on what we are working on right now and what's up next.

[blog]: https://www.offen.dev/blog/

---

### Developing the application

The development setup requires `docker` and `docker-compose` to be installed.

After cloning the repository, you can build the containers and install dependencies using:

```sh
$ make setup
```

Next seed the database for the `server` application:

```sh
$ make bootstrap
```

You can test your setup by starting the application:

```sh
$ make up
```

which should enable you to access <http://localhost:8080/auditorium/> and use the `Auditorium`

Run the tests for all subapplicatons using

```sh
$ make test
```

---

[![NLnet Foundation](https://offen.github.io/press-kit/external-material/nlnet-logo.svg)](https://nlnet.nl/)

We are happy to work with [NLnet Foundation](https://nlnet.nl/) who complement our activities within their [Next Generation Internet](https://nlnet.nl/NGI/) initiative.

---
<a href="https://www.browserstack.com/">
  <img src="https://offen.github.io/press-kit/external-material/browserstack-logo.svg" width="160">
</a>

Cross-Browser testing provided by [BrowserStack](https://www.browserstack.com/).
