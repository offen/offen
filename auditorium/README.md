# auditorium

The `auditorium` is the application supplied to users to view and manage their data. It does expose an authentication layer as all data is implicitly protected by the `.offen.dev` cookie set by the `server`.

The application is currently built using [choo][choo-repo] and [skeleton][skeleton-docs].

[choo-repo]: https://github.com/choojs/choo
[skeleton-docs]: http://getskeleton.com/

---

The app builds into a single page app that can be deployed statically.

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
