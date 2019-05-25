# vault

The `vault` is a small client side application that is supposed to be used by other applications (e.g. the `script` or the `auditorium`) by injecting an invisible `iframe` and then requesting or sending information using `window.postMessage`.

The `vault` is responsible for ensuring both cookies and cryptographic keys are protected by the same origin policy. It should never leak user identifiers or encryption keys to any application that embeds it. When responding to messages, it needs to make sure its messages can only be read by trusted sources so it cannot be tricked into responding to messages from malicious sources.

---

## Development

### Commands

#### Install dependencies

```
npm install
```

#### Run the development server

```
npm start
```

#### Run the tests

```
npm test
```

#### Build a production version

```
npm run build
```

### Environment variables

The application is configured using environment variables. The following values are used:

- `NODE_ENV`: If set to `production`, all dev tooling is skipped and production optimizations applied.
- `SERVER_HOST`: The location of the `server` instance that is used for storing and querying event data, e.g. `https://server.offen.dev`
- `AUDITORIUM_HOST`: The location of the `auditorium` application that is embedding the `vault` instance, e.g. `https://auditorium.offen.dev`
