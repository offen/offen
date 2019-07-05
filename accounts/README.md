# accounts

The `accounts` app is responsible for managing operator accounts and issuing authentication tokens that will identify requests made to the `server` and the `kms` service.

The application is built using the [Flask][flask-docs] framework.

[flask-docs]: http://flask.pocoo.org/

---

## Development

### Commands

#### Install dependencies

```
pip install --user -r requirements.txt -r requirements-dev.txt
```

#### Run the development server

```
FLASK_APP=accounts FLASK_ENV=development flask run
```

#### Run the tests

```
make test
```

#### Auto format code using `black`

```
make fmt
```
