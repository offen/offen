# offen
[![CircleCI](https://circleci.com/gh/offen/offen/tree/master.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/master)
> The offen analytics software

This repository contains all source code needed to build and run __offen__, both on the server as well as on the client.

---

Development of __offen__ has just started, so instructions are rare and things will stay highly volatile for quite some while.

Guidelines for running and developing the Software will be added when it makes sense to do so. Feel free to open an issue if you have a question.

### Developing the application

#### Local cookies and SSL

In local development __offen__ requires to be served both via SSL (in order to use window.crypto) as well as a `local.offen.org` host.

This requires the following steps to be taken:

1. Edit your `/etc/hosts` to include the following line:
  ```
  127.0.0.1       local.offen.org
  ```
2. Install and setup [mkcert](https://github.com/FiloSottile/mkcert). Assuming you have Go installed, this looks like:
  ```
  $ go get -u github.com/FiloSottile/mkcert
  $ mkcert -install
  ```
3. Navigate into the repository root and create a local certificate and key for the `local.offen.org` host:
  ```
  $ mkcert local.offen.org
  ```

You can test setup by starting the application:

```
$ docker-compose up
```

Now you should be able to access <https://local.offen.org:8080/status> in your browser without any security warnings.

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
cd vault
npm install
```

Run the server:

```
docker-compose up
```

Run the tests:

```
cd vault
npm test
```


### License

MIT © offen
