[![CircleCI](https://circleci.com/gh/offen/docs/tree/master.svg?style=svg)](https://circleci.com/gh/offen/docs/tree/master)

# docs

## The docs.offen.dev website

This repository contains the source code for the <https://docs.offen.dev> website.

---

### Developing the documentation

The development setup requires `docker` and `docker-compose` to be installed.

After cloning the repository, you can build the containers and install dependencies using:

```sh
$ make setup
```

You can test your setup by starting the application:

```sh
$ make up
```

which should enable you to access the docs at <http://localhost:4000/>.

### License

MIT © [offen](https://www.offen.dev)
