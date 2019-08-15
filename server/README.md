# server

`server` exposes a HTTP API that can be used to record and query event data. It can also perform key exchange mechanisms, both for user keys as well as the keys associated to accounts.

`server` is a Go application that uses Go modules for dependency management. The expected Go version is 1.12.

---

The app builds into a single executable that can be used to run the application.

---

## Development

### Commands

#### Install dependencies

```
make install
```

#### Bootstrap a clean development database

```
make bootstrap
```

This requires a `kms` server to be running in order to encrypt the operator private keys. If run via `docker-compose` at repository level, this happens automatically.

**Important**: this erases all data currently stored in the local database and creates a fresh set of accounts with no event data.

#### Run the development server

```
make up
```

#### Run the tests

```
make test
```

#### Build a production version

```
make build
```
