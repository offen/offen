# kms

`kms` exposes a HTTP API that can be used to encrypt and decrypt the `PrivateKey`s of operator's keypair. It should not be accessible to any entity other than operators.

`kms` is a Go application that uses Go modules for dependency management. The expected Go version is 1.12.

---

The app builds into a single executable that can be used to run the application.

---

## Development

### Commands

#### Install dependencies

```
make install
```

#### Bootstrap a new key file

```
make bootstrap
```

**Important**: this currently invalidates all data that has been encrypted using the previous key.

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
