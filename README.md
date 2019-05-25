# offen
[![CircleCI](https://circleci.com/gh/offen/offen/tree/master.svg?style=svg)](https://circleci.com/gh/offen/offen/tree/master)
[![Pivotal Tracker](https://img.shields.io/static/v1.svg?label=Project+Planning&message=Pivotal+Tracker&color=informational)](https://www.pivotaltracker.com/n/projects/2334535)

> The offen analytics software

This repository contains all source code needed to build and run __offen__, both on the server as well as on the client. See each of the READMEs in the subdirectories for instructions on how to work on that particular area of the application.

---

Development of __offen__ has just started, so instructions are rare and things will stay highly volatile for quite some while. Also __do not use the software in its current state__ as it is still missing crucial pieces in protecting the data end to end.

Guidelines for running and developing the Software will be added when it makes sense to do so.

Project planning and issue tracking is done using [Pivotal Tracker](https://www.pivotaltracker.com/n/projects/2334535), but feel free to open a GitHub issue if you have a question or found a bug.

### Developing the application

#### Local cookies and SSL

In local development __offen__ requires to be served both via SSL (in order to use window.crypto) as well as a `local.offen.dev` host.

This requires the following steps to be taken:

1. Edit your `/etc/hosts` to include the following line:
  ```
  127.0.0.1       local.offen.dev
  ```
2. Install and setup [mkcert](https://github.com/FiloSottile/mkcert). Assuming you have Go installed, this looks like:
  ```
  $ go get -u github.com/FiloSottile/mkcert
  $ mkcert -install
  ```
3. Navigate into the repository root and create a local certificate and key for the `local.offen.dev` host:
  ```
  $ mkcert local.offen.dev
  ```

You can test setup by starting the application:

```
$ docker-compose up
```

Now you should be able to access <https://local.offen.dev:8080/status> in your browser without any security warnings.

### License

MIT © [offen](https://www.offen.dev)
