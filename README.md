# offen
[![CircleCI](https://circleci.com/gh/offen/offen/tree/master.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/master)
[![Patreon](https://img.shields.io/static/v1.svg?label=patreon&message=donate&color=e85b46)](https://www.patreon.com/offen)

> The offen analytics software

This repository contains all source code needed to build and run __offen__, both on the server as well as on the client. Also see each of the READMEs in the subdirectories for information on how to work on that particular area of the application.

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
$ docker-compose up
```

which should enable you to access <http://localhost:8080/auditorium/> and use the `auditorium`

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
