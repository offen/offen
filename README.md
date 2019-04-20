# offen
[![CircleCI](https://circleci.com/gh/offen/offen/tree/master.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/master)
> The offen analytics software

This repository contains all source code needed to build and run __offen__, both on the server as well as on the client.

---

Development of __offen__ has just started, so instructions are rare and things will stay highly volatile for quite some while.

Guidelines for running and developing the Software will be added when it makes sense to do so. Feel free to open an issue if you have a question.

### Developing the application

#### `server`

To work on the `server` you will need to install `docker-compose` and Go 1.12+.

First, bootstrap the dockerized Postgres database used for development:

```
docker-compose run server make bootstrap
```

Run the server:

```
docker-compose up
```

Run the tests:

```
docker-compose run server make
```

#### `vault`

To work on the `vault` you will need to install `docker-compose`.

First, install the project's dependencies:

```
docker-compose run vault npm install
```

Run the server:

```
docker-compose up
```

Run the tests:

```
docker-compose run vault npm test
```


### License

MIT © offen
