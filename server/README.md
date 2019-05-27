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

### Command line flags

The application is configured using environment flags on startup. The following values are used:

  - `port`: the port the server binds to (default 8080)
  - `conn`: a database connection string
  - `dialect`: the database dialect used by the given connection string (default "postgres")
  - `key`: the path to a SSL key in PEM format
  - `cert`: the path to a SSL certificate in PEM format
  - `origin`:the origin used in CORS headers (default "*")
