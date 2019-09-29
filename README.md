# offen
[![CircleCI](https://circleci.com/gh/offen/offen/tree/master.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/master)
[![Patreon](https://img.shields.io/static/v1.svg?label=patreon&message=donate&color=e85b46)](https://www.patreon.com/offen)

> The offen analytics software

This repository contains all source code needed to build and run __offen__, both on the server as well as on the client. See each of the READMEs in the subdirectories for instructions on how to work on that particular area of the application.

---

Development of __offen__ has just started, so instructions are rare and things will stay highly volatile for quite some while.

Guidelines for running and developing the Software will be added when it makes sense to do so. If you have questions in the meantime, feel free to open an issue.

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

### License

MIT © [offen](https://www.offen.dev)
