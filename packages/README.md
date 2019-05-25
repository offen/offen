# packages

`packages` contains JavaScript modules shared across applications. Consumer should use the `file:` scheme to install the package like so:

```json
{
  "dependencies": {
    "offen": "file:./../packages"
  }
}
```

---

## Development

### Commands

#### Install dependencies

```
npm install
```

#### Run the tests

```
npm test
```
