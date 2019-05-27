# script

The `script` is the script operators are using to deploy _offen_ on a site.

It collects events autonoumously and only needs to be parametrized with an Account ID. This is being done using the `data-account-id` attribute on the `<script>` tag:

```html
<script src="https://script.offen.dev/offen.js" data-account-id="433d404a-5416-4e12-ac6e-7ee5ea222b39"></script>
```

---

The app builds into a single JavaScript file that can be deployed to a CDN.

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
- `VAULT_HOST`: The location of the `vault` deployment to load, e.g. `https://vault.offen.dev`. This implicitly determines the target `server` environment that will be used.
